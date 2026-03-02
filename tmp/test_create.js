const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    console.log("No categories found.");
    return;
  }
  
  const payload = {
    name: "Test Product",
    category_id: categories[0].id,
    brand: "",
    sku_code: "",
    unit: "piece",
    purchase_price: "0",
    selling_price: "0",
    gst_percent: "18",
    current_stock: "0",
    min_stock_alert: "10"
  };

  try {
    const newProduct = await prisma.product.create({
      data: {
        name: payload.name,
        category_id: payload.category_id,
        brand: payload.brand || null,
        sku_code: payload.sku_code || null,
        unit: payload.unit,
        purchase_price: parseFloat(payload.purchase_price),
        selling_price: parseFloat(payload.selling_price),
        gst_percent: parseFloat(payload.gst_percent || 0),
        current_stock: parseFloat(payload.current_stock || 0),
        min_stock_alert: parseFloat(payload.min_stock_alert || 10),
        supplier_id: payload.supplier_id || null,
      }
    });
    console.log("Created successfully:", newProduct.id);
    
    // Cleanup
    await prisma.product.delete({ where: { id: newProduct.id } });
  } catch (error) {
    console.error("Failed to create:", error);
  }
}

main().finally(() => prisma.$disconnect());
