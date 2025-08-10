// Encapsulate in a function you can call from any page/app
function runKeyMigration() {
  const migrations = [
    {
      oldKey: "BandPOSDB_products",
      newKey: "BandPOSDB_products"
    },
    {
      oldKey: "BandPOSDB_discounts",
      newKey: "BandPOSDB_discounts"
    },
    {
      oldKey: "BandPOSDB_productIdCounter",
      newKey: "BandPOSDB_productIdCounter"
    },
    {
      oldKey: "BandPOSDB_sales",
      newKey: "BandPOSDB_sales"
    },
    {
      oldKey: "shoppingCart",
      newKey: "shoppingCart"
    },
    {
      oldKey: "customerCheckoutInfo",
      newKey: "customerCheckoutInfo"
    },
    {
      oldKey: "shippingInfo",
      newKey: "customerCheckoutInfo"  // Looks like you renamed shippingInfo to customerCheckoutInfo
    }
  ];

  migrations.forEach(({ oldKey, newKey }) => {
    const hasOld = localStorage.getItem(oldKey) !== null;
    const hasNew = localStorage.getItem(newKey) !== null;

    if (hasOld && !hasNew) {
      const oldValue = localStorage.getItem(oldKey);
      localStorage.setItem(newKey, oldValue);
      localStorage.removeItem(oldKey);
      console.log(`Migrated key "${oldKey}" to "${newKey}".`);
    }
  });
}

// Expose globally for easy calling
window.runKeyMigration = runKeyMigration;