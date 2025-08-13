// -------------------- STORAGE KEYS --------------------
const PRODUCTS_KEY = "inventory_products";
const DISCOUNTS_KEY = "inventory_discounts";
const DEFAULT_SIZES = ["XS","S","M","L","XL","2XL","3XL","4XL"];

// -------------------- ELEMENTS --------------------
const productSection = document.getElementById("inventorySection");
const discountSection = document.getElementById("discountSection");
const addProductForm = document.getElementById("addProductForm");
const productTableBody = document.getElementById("productTableBody");
const productImageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");

// -------------------- DATA --------------------
let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
let discounts = JSON.parse(localStorage.getItem(DISCOUNTS_KEY)) || [];
let currentCompressedImage = "";

// -------------------- SAVE HELPERS --------------------
function saveProducts() {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}
function saveDiscounts() {
    localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts));
}

// -------------------- IMAGE PREVIEW & COMPRESSION --------------------
productImageInput?.addEventListener("change", function() {
    const file = this.files[0];
    if (!file) { currentCompressedImage = ""; imagePreview.src=""; imagePreview.style.display="none"; return; }
    const reader = new FileReader();
    reader.onload = function(e){
        const img = new Image();
        img.onload = function(){
            const canvas = document.createElement("canvas");
            const maxWidth = 500;
            const scale = Math.min(maxWidth / img.width, 1);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img,0,0,canvas.width,canvas.height);
            currentCompressedImage = canvas.toDataURL("image/jpeg",0.7);
            imagePreview.src = currentCompressedImage;
            imagePreview.style.display = "block";
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// -------------------- ADD PRODUCT --------------------
addProductForm.addEventListener("submit", e=>{
    e.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value);
    const genderInput = document.querySelector('input[name="productGender"]:checked');
    const gender = genderInput ? genderInput.value : "";
    const hasSizes = document.getElementById("productHasSizes").checked;

    if(!name || !category || isNaN(price) || !gender) {
        alert("Please fill in all product fields correctly.");
        return;
    }

    let sizes = {};
    if(hasSizes){
        DEFAULT_SIZES.forEach(size=>sizes[size]=0);
    } else {
        sizes.OneSize = 0;
    }

    products.push({
        name, category, price, gender, hasSizes, sizes,
        image: currentCompressedImage || ""
    });

    saveProducts();
    renderProducts();
    addProductForm.reset();
    currentCompressedImage = "";
    imagePreview.src="";
    imagePreview.style.display="none";
});

// -------------------- RENDER PRODUCTS --------------------
function renderProducts(){
    productTableBody.innerHTML = "";
    if(products.length===0){
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 6;
        td.style.textAlign="center";
        td.textContent="No products found.";
        tr.appendChild(td);
        productTableBody.appendChild(tr);
        return;
    }

    // group by category
    const grouped = {};
    products.forEach((p,index)=>{
        if(!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push({...p,index});
    });

    Object.keys(grouped).forEach(category=>{
        // category header
        const trHeader = document.createElement("tr");
        const tdHeader = document.createElement("td");
        tdHeader.colSpan=6;
        tdHeader.style.fontWeight="bold";
        tdHeader.textContent=category;
        trHeader.appendChild(tdHeader);
        productTableBody.appendChild(trHeader);

        grouped[category].forEach(product=>{
            const tr = document.createElement("tr");

            // create size inputs
            let sizeInputs = "";
            if(product.hasSizes){
                sizeInputs = DEFAULT_SIZES.map(size=>`<label>${size}: <input type="number" min="0" value="${product.sizes[size]}" data-size="${size}" class="size-input"></label>`).join(" ");
            } else {
                sizeInputs = `<label>One Size: <input type="number" min="0" value="${product.sizes.OneSize}" data-size="OneSize" class="size-input"></label>`;
            }

            tr.innerHTML = `
                <td>${product.image ? `<img src="${product.image}" class="product-thumb" style="max-width:50px; max-height:50px;">` : ""}</td>
                <td><input type="text" value="${product.name}" class="edit-field name-field"></td>
                <td><input type="number" min="0" step="0.01" value="${product.price}" class="edit-field price-field"></td>
                <td>
                  <select class="edit-field gender-field">
                    <option value="M" ${product.gender==="M"?"selected":""}>M</option>
                    <option value="F" ${product.gender==="F"?"selected":""}>F</option>
                  </select>
                </td>
                <td>${sizeInputs}</td>
                <td>
                  <input type="file" accept="image/*" class="row-image-input"><br>
                  <button class="save-btn" data-index="${product.index}">Save</button>
                  <button class="delete-btn" data-index="${product.index}">Delete</button>
                </td>
            `;
            productTableBody.appendChild(tr);

            // attach image change for row
            const rowImageInput = tr.querySelector(".row-image-input");
            rowImageInput.addEventListener("change", function(ev){
                const file = this.files[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = function(e){
                    const img = new Image();
                    img.onload = function(){
                        const canvas = document.createElement("canvas");
                        const maxWidth = 500;
                        const scale = Math.min(maxWidth/img.width,1);
                        canvas.width = img.width*scale;
                        canvas.height = img.height*scale;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img,0,0,canvas.width,canvas.height);
                        const dataUrl = canvas.toDataURL("image/jpeg",0.7);
                        product.image = dataUrl;
                        saveProducts();
                        renderProducts();
                    };
                    img.src=e.target.result;
                };
                reader.readAsDataURL(file);
            });
        });
    });

    // attach save/delete
    document.querySelectorAll(".save-btn").forEach(btn=>{
        btn.addEventListener("click", e=>{
            const idx = parseInt(btn.dataset.index);
            const tr = btn.closest("tr");
            const product = products[idx];

            product.name = tr.querySelector(".name-field").value.trim();
            product.price = parseFloat(tr.querySelector(".price-field").value);
            product.gender = tr.querySelector(".gender-field").value;

            // sizes
            if(product.hasSizes){
                DEFAULT_SIZES.forEach(size=>{
                    const input = tr.querySelector(`.size-input[data-size="${size}"]`);
                    product.sizes[size] = parseInt(input.value)||0;
                });
            } else {
                const input = tr.querySelector(`.size-input[data-size="OneSize"]`);
                product.sizes.OneSize = parseInt(input.value)||0;
            }

            saveProducts();
            renderProducts();
        });
    });

    document.querySelectorAll(".delete-btn").forEach(btn=>{
        btn.addEventListener("click", e=>{
            const idx = parseInt(btn.dataset.index);
            if(confirm("Are you sure you want to delete this product?")){
                products.splice(idx,1);
                saveProducts();
                renderProducts();
            }
        });
    });
}

// -------------------- DISCOUNT LOGIC --------------------
const discountForm = document.getElementById("discountForm");
const discountTableBody = document.getElementById("discountTableBody");

function renderDiscounts(){
    discountTableBody.innerHTML="";
    if(discounts.length===0){
        const tr=document.createElement("tr");
        const td=document.createElement("td");
        td.colSpan=4;
        td.style.textAlign="center";
        td.textContent="No discounts found.";
        tr.appendChild(td);
        discountTableBody.appendChild(tr);
        return;
    }

    discounts.forEach((d,index)=>{
        const tr=document.createElement("tr");
        tr.innerHTML=`
          <td><input type="text" value="${d.reason}" class="edit-discount reason-field"></td>
          <td>
            <select class="edit-discount type-field">
              <option value="flat" ${d.type==="flat"?"selected":""}>Flat $ off</option>
              <option value="percent" ${d.type==="percent"?"selected":""}>% off</option>
            </select>
          </td>
          <td><input type="number" min="0" step="0.01" value="${d.value}" class="edit-discount value-field"></td>
          <td>
            <button class="save-discount-btn" data-index="${index}">Save</button>
            <button class="delete-discount-btn" data-index="${index}">Delete</button>
          </td>
        `;
        discountTableBody.appendChild(tr);
    });

    // attach save/delete
    document.querySelectorAll(".save-discount-btn").forEach(btn=>{
        btn.addEventListener("click", e=>{
            const idx=parseInt(btn.dataset.index);
            const tr=btn.closest("tr");
            discounts[idx].reason = tr.querySelector(".reason-field").value.trim();
            discounts[idx].type = tr.querySelector(".type-field").value;
            discounts[idx].value = parseFloat(tr.querySelector(".value-field").value)||0;
            saveDiscounts();
            renderDiscounts();
        });
    });

    document.querySelectorAll(".delete-discount-btn").forEach(btn=>{
        btn.addEventListener("click", e=>{
            const idx=parseInt(btn.dataset.index);
            if(confirm("Are you sure you want to delete this discount?")){
                discounts.splice(idx,1);
                saveDiscounts();
                renderDiscounts();
            }
        });
    });
}

discountForm.addEventListener("submit", e=>{
    e.preventDefault();
    const reason=document.getElementById("discountName").value.trim();
    const type=document.getElementById("discountType").value;
    const value=parseFloat(document.getElementById("discountValue").value);

    if(!reason || isNaN(value)){
        alert("Please fill in discount reason and a valid value.");
        return;
    }

    discounts.push({reason,type,value});
    saveDiscounts();
    renderDiscounts();
    discountForm.reset();
});

// -------------------- INIT --------------------
window.addEventListener("DOMContentLoaded",()=>{
    renderProducts();
    renderDiscounts();
});
window.addEventListener("resize", renderProducts);