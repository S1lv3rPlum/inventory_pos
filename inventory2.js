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
  if (!products || products.length === 0) {
    alert("No products to export.");
    return;
  }
  const headers = [
    "Name",
    "Category",
    "Price",
    "Gender",
    "Image",
    ...DEFAULT_SIZES,
    "One Size"
  ];
  const data = products.map((p, i) => {
    const row = {
      Name: p.name,
      Category: p.category,
      Price: p.price,
      Gender: p.gender,
      // Export image as filename placeholder if base64 detected
      Image: (() => {
        if (!p.image) return "";
        if (typeof p.image === "string" && p.image.startsWith("data:image")) {
          // Base64 detected - replace with filename placeholder
          return `image_${i + 1}.jpg`;
        }
        // Otherwise export value as-is (e.g. a filename or URL)
        return p.image;
      })()
    };
    if (p.hasSizes) {
      DEFAULT_SIZES.forEach(size => {
        row[size] = p.sizes[size] || 0;
      });
      row["One Size"] = "";
    } else {
      DEFAULT_SIZES.forEach(size => {
        row[size] = "";
      });
      row["One Size"] = p.sizes.OneSize || 0;
    }
    return row;
  });
  // Create worksheet with explicit header order
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  // Create a new workbook and append the worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  // Trigger download of Excel file named Inventory.xlsx
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

    if(!name || !category || isNaN(price)) {
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
// Helper function to auto-size number inputs by measuring text width
function autoSizeNumberInput(input) {
  const text = input.value || input.placeholder || "0";
  const span = document.createElement("span");
  const style = window.getComputedStyle(input);
  
  span.style.font = style.font;
  span.style.fontSize = style.fontSize;
  span.style.fontFamily = style.fontFamily;
  span.style.fontWeight = style.fontWeight;
  span.style.letterSpacing = style.letterSpacing;
  span.style.visibility = "hidden";
  span.style.position = "absolute";
  span.style.whiteSpace = "pre";
  span.textContent = text;
  document.body.appendChild(span);
  const width = span.getBoundingClientRect().width;
  document.body.removeChild(span);
  // Add padding to accommodate input padding and spinner controls
  input.style.width = (width + 24) + "px";
}

// Keep your existing helper autoSizeNumberInput outside this function as before
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
      // Always create an <img> element for image preview, even if no image yet
      const img = document.createElement("img");
      img.style.maxWidth = "50px";
      img.style.maxHeight = "50px";
      img.style.objectFit = "contain"; // optional: keep image aspect ratio nicely
      if (product.image) {
        img.src = product.image;
      } else {
        // If no image, set empty src (renders nothing)
        img.src = "";
      }
      tdImage.appendChild(img);
      tr.appendChild(tdImage);
      // --- Name Cell ---
      const tdName = document.createElement("td");
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = product.name;
      nameInput.size = Math.max(product.name.length, 1);
      nameInput.className = "edit-field name-field";
      nameInput.disabled = true; // Disabled by default
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
      priceInput.disabled = true; // Disabled by default
      tdPrice.appendChild(priceInput);
      tr.appendChild(tdPrice);
      autoSizeNumberInput(priceInput);
      priceInput.addEventListener("input", () => autoSizeNumberInput(priceInput));
      // --- Gender Cell ---
      const tdGender = document.createElement("td");
      const genderSelect = document.createElement("select");
      genderSelect.className = "edit-field gender-field";
      genderSelect.disabled = true;
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
          label.textContent = size + ": ";
          const input = document.createElement("input");
          input.type = "number";
          input.min = 0;
          input.value = product.sizes[size] || 0;
          input.dataset.size = size;
          input.className = "size-input";
          input.disabled = true;
          label.appendChild(input);
          sizeContainer.appendChild(label);
          autoSizeNumberInput(input);
          input.addEventListener("input", () => autoSizeNumberInput(input));
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
        input.disabled = true;
        label.appendChild(input);
        sizeContainer.appendChild(label);
        autoSizeNumberInput(input);
        input.addEventListener("input", () => autoSizeNumberInput(input));
      }
      tr.appendChild(tdSizes);
      // --- Actions Cell ---
      const tdActions = document.createElement("td");
      // Hidden native file input, visually hidden but functional
      const rowImageInput = document.createElement("input");
      rowImageInput.type = "file";
      rowImageInput.accept = "image/*";
      rowImageInput.style.position = "absolute";
      rowImageInput.style.left = "-9999px";
      rowImageInput.style.width = "0";
      rowImageInput.style.height = "0";
      rowImageInput.style.opacity = "0";
      rowImageInput.style.overflow = "hidden";
      tdActions.appendChild(rowImageInput);
      // Styled button to trigger image picker, hidden unless editing
      const selectImageBtn = document.createElement("button");
      selectImageBtn.textContent = "Select Image";
      selectImageBtn.style.display = "none";
      selectImageBtn.style.marginBottom = "8px";
      tdActions.appendChild(selectImageBtn);
      tdActions.appendChild(document.createElement("br"));
      // Edit Button
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.className = "edit-btn";
      editBtn.dataset.index = product.index;
      tdActions.appendChild(editBtn);
      // Delete Button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "delete-btn";
      deleteBtn.dataset.index = product.index;
      tdActions.appendChild(deleteBtn);
      tr.appendChild(tdActions);
      // For temporarily storing the selected file during editing
      let tempSelectedImageFile = null;
      // Clicking "Select Image" button triggers the hidden file input click
      selectImageBtn.addEventListener("click", () => {
        rowImageInput.click();
      });
      // When file selected, store it and preview immediately by updating img.src
      rowImageInput.addEventListener("change", function () {
        if (this.files && this.files[0]) {
          tempSelectedImageFile = this.files[0];
          const reader = new FileReader();
          reader.onload = e => {
            if (img) {
              img.src = e.target.result; // preview the selected image immediately
            }
          };
          reader.readAsDataURL(tempSelectedImageFile);
        }
      });
      // Edit button click handler toggles between edit and save modes
      editBtn.addEventListener("click", () => {
        if (editBtn.textContent === "Edit") {
          // Enable input fields for editing
          nameInput.disabled = false;
          priceInput.disabled = false;
          genderSelect.disabled = false;
          sizeContainer.querySelectorAll("input").forEach(input => (input.disabled = false));
          // Show image selector controls
          selectImageBtn.style.display = "inline-block";
          rowImageInput.style.display = "inline-block";
          editBtn.textContent = "Save";
          tempSelectedImageFile = null; // clear previous selection if any
        } else {
          // Save logic
          // Save function called once image compression is done (or immediately if no image change)
          function finalizeSave() {
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
  // Important: update original product in the products array
  products[product.index] = { ...product };
  // Disable fields after save
  nameInput.disabled = true;
  priceInput.disabled = true;
  genderSelect.disabled = true;
  sizeContainer.querySelectorAll("input").forEach(input => (input.disabled = true));
  // Hide image selectors
  selectImageBtn.style.display = "none";
  rowImageInput.style.display = "none";
  rowImageInput.value = ""; // clear file input
  editBtn.textContent = "Edit";
  saveProducts();
  renderProducts();
}
          // If an image was picked, compress it first asynchronously
          if (tempSelectedImageFile) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const imgElement = new Image();
    imgElement.onload = function () {
      // Log original image size
      console.log("Original image size:", imgElement.width, "x", imgElement.height);
      
      const canvas = document.createElement("canvas");
      const maxWidth = 500;
      // Safe fallback for width/height in case of invalid image metadata
      let imgWidth = imgElement.width || maxWidth;
      let imgHeight = imgElement.height || maxWidth;
      // Compute scale factor; never upscale larger than original or fallback size
      const scale = Math.min(maxWidth / imgWidth, 1);
      // Set canvas size with scale applied
      canvas.width = imgWidth * scale;
      canvas.height = imgHeight * scale;
      // Debug canvas size
      console.log("Canvas size for compression:", canvas.width, "x", canvas.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
      // Generate compressed image as base64 JPEG
      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
      // Log length of generated data URL to verify output
      console.log("Compressed image data length:", compressedDataUrl.length);
      // Save compressed image to product.image
      product.image = compressedDataUrl;
      // Debug presence of product.image before final save
      console.log("Product image assigned before save?", Boolean(product.image));
      // Now finalize save (update fields, disable inputs, save to localStorage, re-render)
      finalizeSave();
    };
    imgElement.onerror = function () {
      console.error("Failed to load image for compression.");
      alert("Error: Could not load selected image.");
    };
    imgElement.src = e.target.result;
  };
  reader.onerror = function () {
    console.error("Failed to read selected image file.");
    alert("Error: Could not read selected image file.");
  };
  reader.readAsDataURL(tempSelectedImageFile);
} else {
  // No new image selected, just finalize save directly
  finalizeSave();
}
        }
      });
      // Delete button handler
      deleteBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this product?")) {
          products.splice(product.index, 1);
          saveProducts();
          renderProducts();
        }
      });
      productTableBody.appendChild(tr);
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

    discounts.forEach((d, index) => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" value="${d.reason}" class="edit-discount reason-field" disabled></td>
    <td>
      <select class="edit-discount type-field" disabled>
        <option value="flat" ${d.type === "flat" ? "selected" : ""}>Flat $ off</option>
        <option value="percent" ${d.type === "percent" ? "selected" : ""}>% off</option>
      </select>
    </td>
    <td><input type="number" min="0" step="0.01" value="${d.value}" class="edit-discount value-field" disabled></td>
    <td>
      <button class="edit-discount-btn" data-index="${index}">Edit</button>
      <button class="delete-discount-btn" data-index="${index}">Delete</button>
    </td>
  `;
  discountTableBody.appendChild(tr);
  const editBtn = tr.querySelector(".edit-discount-btn");
  const deleteBtn = tr.querySelector(".delete-discount-btn");
  const reasonInput = tr.querySelector(".reason-field");
  const typeSelect = tr.querySelector(".type-field");
  const valueInput = tr.querySelector(".value-field");
  editBtn.addEventListener("click", () => {
    if (editBtn.textContent === "Edit") {
      // Enable editing
      reasonInput.disabled = false;
      typeSelect.disabled = false;
      valueInput.disabled = false;
      editBtn.textContent = "Save";
    } else {
      // Save changes
      discounts[index].reason = reasonInput.value.trim();
      discounts[index].type = typeSelect.value;
      discounts[index].value = parseFloat(valueInput.value) || 0;
      // Disable editing
      reasonInput.disabled = true;
      typeSelect.disabled = true;
      valueInput.disabled = true;
      editBtn.textContent = "Edit";
      saveDiscounts();
      renderDiscounts();
    }
  });
  deleteBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete this discount?")) {
      discounts.splice(index, 1);
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
