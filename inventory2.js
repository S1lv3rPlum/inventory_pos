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
const discountForm = document.getElementById("discountForm");
const discountTableBody = document.getElementById("discountTableBody");

// -------------------- DATA --------------------
let products = JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
let discounts = JSON.parse(localStorage.getItem(DISCOUNTS_KEY)) || [];
let currentCompressedImage = "";

// -------------------- SAVE HELPERS --------------------
function saveProducts() { localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); }
function saveDiscounts() { localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts)); }


// ---- export functions----
function exportInventory() {
    if (products.length === 0) {
        alert("No products to export.");
        return;
    }

    const data = products.map(p => {
        const row = {
            Name: p.name,
            Category: p.category,
            Price: p.price,
            Gender: p.gender,
            Image: p.image || ""
        };

        // Add each size as its own column
        if (p.hasSizes) {
            DEFAULT_SIZES.forEach(size => {
                row[size] = p.sizes[size] || 0;
            });
        } else {
            row["One Size"] = p.sizes.OneSize || 0;
        }

        return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");

    XLSX.writeFile(wb, "Inventory.xlsx");
}

function exportDiscounts() {
    if (discounts.length === 0) {
        alert("No discounts to export.");
        return;
    }

    const data = discounts.map(d => ({
        Reason: d.reason,
        Type: d.type,
        Value: d.value
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Discounts");

    XLSX.writeFile(wb, "Discounts.xlsx");
}

// --- import functions----
function handleInventoryImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Clear current products
        products = [];

        rows.forEach(row => {
            // Determine if product has multiple sizes
            const hasSizes = DEFAULT_SIZES.some(size => row[size] !== undefined);
            const sizes = {};

            if (hasSizes) {
                DEFAULT_SIZES.forEach(size => {
                    sizes[size] = parseInt(row[size]) || 0;
                });
            } else {
                sizes.OneSize = parseInt(row["One Size"]) || 0;
            }

            products.push({
                name: row["Name"] || "",
                category: row["Category"] || "",
                price: parseFloat(row["Price"]) || 0,
                gender: row["Gender"] || "",
                hasSizes,
                sizes,
                image: row["Image"] || ""
            });
        });

        saveProducts();
        renderProducts();
        alert("Inventory imported successfully!");
    };

    reader.readAsArrayBuffer(file);
}

function handleDiscountImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Clear current discounts
        discounts = [];

        rows.forEach(row => {
            discounts.push({
                reason: row["Reason"] || "",
                type: row["Type"] || "flat",
                value: parseFloat(row["Value"]) || 0
            });
        });

        saveDiscounts();
        renderDiscounts();
        alert("Discounts imported successfully!");
    };

    reader.readAsArrayBuffer(file);
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
function renderProducts() {
    productTableBody.innerHTML = "";

    if (products.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 6;
        td.style.textAlign = "center";
        td.textContent = "No products found.";
        tr.appendChild(td);
        productTableBody.appendChild(tr);
        return;
    }

    // Group products by category
    const grouped = {};
    products.forEach((p, index) => {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push({ ...p, index });
    });

    Object.keys(grouped).forEach(category => {
        // Category header row
        const trHeader = document.createElement("tr");
        const tdHeader = document.createElement("td");
        tdHeader.colSpan = 6;
        tdHeader.style.fontWeight = "bold";
        tdHeader.textContent = category;
        trHeader.appendChild(tdHeader);
        productTableBody.appendChild(trHeader);

        grouped[category].forEach(product => {
            const tr = document.createElement("tr");

            // --- Image Cell ---
            const tdImage = document.createElement("td");
            if (product.image) {
                const img = document.createElement("img");
                img.src = product.image;
                img.style.maxWidth = "50px";
                img.style.maxHeight = "50px";
                tdImage.appendChild(img);
            }
            tr.appendChild(tdImage);

            // --- Name Cell ---
            const tdName = document.createElement("td");
            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.value = product.name;
            nameInput.className = "edit-field name-field";
            tdName.appendChild(nameInput);
            tr.appendChild(tdName);

            // --- Price Cell ---
            const tdPrice = document.createElement("td");
            const priceInput = document.createElement("input");
            priceInput.type = "number";
            priceInput.min = 0;
            priceInput.step = 0.01;
            priceInput.value = product.price;
            priceInput.className = "edit-field price-field";
            tdPrice.appendChild(priceInput);
            tr.appendChild(tdPrice);

            // --- Gender Cell ---
            const tdGender = document.createElement("td");
            const genderSelect = document.createElement("select");
            genderSelect.className = "edit-field gender-field";
            ["M", "F"].forEach(g => {
                const opt = document.createElement("option");
                opt.value = g;
                opt.textContent = g;
                if (product.gender === g) opt.selected = true;
                genderSelect.appendChild(opt);
            });
            tdGender.appendChild(genderSelect);
            tr.appendChild(tdGender);

            // --- Sizes Cell ---
            const tdSizes = document.createElement("td");
            tdSizes.className = "sizes-column";
            const sizeContainer = document.createElement("div");
            sizeContainer.className = "size-input-container";
            tdSizes.appendChild(sizeContainer);

            if (product.hasSizes) {
                DEFAULT_SIZES.forEach(size => {
                    const label = document.createElement("label");
                    label.style.display = "inline-flex";
                    label.style.alignItems = "center";
                    label.style.marginRight = "6px";
                    label.textContent = size + ": ";

                    const input = document.createElement("input");
                    input.type = "number";
                    input.min = 0;
                    input.value = product.sizes[size] || 0;
                    input.dataset.size = size;
                    input.className = "size-input";

                    label.appendChild(input);
                    sizeContainer.appendChild(label);
                });
            } else {
                const label = document.createElement("label");
                label.textContent = "One Size: ";
                const input = document.createElement("input");
                input.type = "number";
                input.min = 0;
                input.value = product.sizes.OneSize || 0;
                input.dataset.size = "OneSize";
                input.className = "size-input";
                label.appendChild(input);
                sizeContainer.appendChild(label);
            }
            tr.appendChild(tdSizes);

            // --- Actions Cell ---
            const tdActions = document.createElement("td");
            const rowImageInput = document.createElement("input");
            rowImageInput.type = "file";
            rowImageInput.accept = "image/*";
            rowImageInput.className = "row-image-input";
            tdActions.appendChild(rowImageInput);
            tdActions.appendChild(document.createElement("br"));

            const saveBtn = document.createElement("button");
            saveBtn.textContent = "Save";
            saveBtn.className = "save-btn";
            saveBtn.dataset.index = product.index;
            tdActions.appendChild(saveBtn);

            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Delete";
            deleteBtn.className = "delete-btn";
            deleteBtn.dataset.index = product.index;
            tdActions.appendChild(deleteBtn);

            tr.appendChild(tdActions);

            productTableBody.appendChild(tr);

            // --- Row image change handler ---
            rowImageInput.addEventListener("change", function () {
                const file = this.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function (e) {
                    const img = new Image();
                    img.onload = function () {
                        const canvas = document.createElement("canvas");
                        const maxWidth = 500;
                        const scale = Math.min(maxWidth / img.width, 1);
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        product.image = canvas.toDataURL("image/jpeg", 0.7);
                        saveProducts();
                        renderProducts();
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });

            // --- Save button ---
            saveBtn.addEventListener("click", () => {
                product.name = nameInput.value.trim();
                product.price = parseFloat(priceInput.value) || 0;
                product.gender = genderSelect.value;

                if (product.hasSizes) {
                    DEFAULT_SIZES.forEach(size => {
                        const input = sizeContainer.querySelector(`input[data-size="${size}"]`);
                        product.sizes[size] = parseInt(input.value) || 0;
                    });
                } else {
                    const input = sizeContainer.querySelector(`input[data-size="OneSize"]`);
                    product.sizes.OneSize = parseInt(input.value) || 0;
                }

                saveProducts();
                renderProducts();
            });

            // --- Delete button ---
            deleteBtn.addEventListener("click", () => {
                if (confirm("Are you sure you want to delete this product?")) {
                    products.splice(product.index, 1);
                    saveProducts();
                    renderProducts();
                }
            });
        });
    });
}

// -------------------- DISCOUNT LOGIC --------------------
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

        tr.querySelector(".save-discount-btn").addEventListener("click", ()=>{
            discounts[index].reason = tr.querySelector(".reason-field").value.trim();
            discounts[index].type = tr.querySelector(".type-field").value;
            discounts[index].value = parseFloat(tr.querySelector(".value-field").value)||0;
            saveDiscounts();
            renderDiscounts();
        });

        tr.querySelector(".delete-discount-btn").addEventListener("click", ()=>{
            if(confirm("Are you sure you want to delete this discount?")){
                discounts.splice(index,1);
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