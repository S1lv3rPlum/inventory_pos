document.addEventListener('DOMContentLoaded', () => {
  const dbName = 'ProductDatabase';
  const dbVersion = 1;
  let db;

  const form = document.getElementById('product-form');
  const categoryInput = document.getElementById('category');
  const nameInput = document.getElementById('name');
  const quantityInput = document.getElementById('quantity');
  const productTable = document.getElementById('product-table');

  const request = indexedDB.open(dbName, dbVersion);

  request.onerror = (event) => {
    console.error('Database error:', event.target.errorCode);
  };

  request.onsuccess = (event) => {
    db = event.target.result;
    displayProducts();
  };

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    const objectStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('category', 'category', { unique: false });
    objectStore.createIndex('name', 'name', { unique: false });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newProduct = {
      category: categoryInput.value.trim(),
      name: nameInput.value.trim(),
      quantity: parseInt(quantityInput.value, 10)
    };

    const transaction = db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    store.add(newProduct);

    transaction.oncomplete = () => {
      form.reset();
      displayProducts();
    };

    transaction.onerror = (event) => {
      console.error('Transaction failed:', event.target.error);
    };
  });

  function displayProducts() {
    const transaction = db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');

    const allProducts = [];
    store.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        allProducts.push(cursor.value);
        cursor.continue();
      } else {
        renderGroupedTable(allProducts);
      }
    };
  }

  function renderGroupedTable(products) {
    productTable.innerHTML = '';

    const grouped = {};
    for (const product of products) {
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category].push(product);
    }

    for (const category in grouped) {
      const categoryRow = document.createElement('tr');
      categoryRow.innerHTML = `<th colspan="3">${category}</th>`;
      productTable.appendChild(categoryRow);

      grouped[category].forEach((p) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${p.name}</td>
          <td>${p.quantity}</td>
        `;
        productTable.appendChild(row);
      });
    }
  }
});