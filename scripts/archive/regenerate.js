async function run() {
  const proj = "bcn-store-c52c9";
  const db = "ai-studio-bcnstore-041453b7-6922-4e2a-9e3d-2fb6d648df8d";
  const key = "AIzaSyDIB9zHeEqMi7nPG8U8fnyzypPWlVwS1uU";
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${proj}/databases/${db}/documents`;
  
  console.log("Fetching products...");
  const pRes = await fetch(`${baseUrl}/products?pageSize=1000&key=${key}`);
  const pData = await pRes.json();
  const products = (pData.documents || []).map(doc => {
    const fields = doc.fields;
    return {
      id: doc.name.split('/').pop(),
      name: fields.name?.stringValue || "",
      nameHi: fields.nameHi?.stringValue || "",
      category: fields.categoryId?.stringValue || fields.category?.stringValue || "Uncategorized"
    };
  });
  
  console.log(`Found ${products.length} products.`);

  console.log("Fetching categories...");
  const cRes = await fetch(`${baseUrl}/categories?pageSize=1000&key=${key}`);
  const cData = await cRes.json();
  const categories = (cData.documents || []).map(doc => {
    const fields = doc.fields;
    return {
      id: doc.name.split('/').pop(),
      nameEn: fields.nameEn?.stringValue || "",
      nameHi: fields.nameHi?.stringValue || "",
      description: fields.description?.stringValue || ""
    };
  });
  
  console.log(`Found ${categories.length} categories.`);
  
  console.log("Calling /api/analyze-catalog...");
  const aiRes = await fetch("http://localhost:3000/api/analyze-catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products, categories })
  });
  
  const relations = await aiRes.json();
  console.log("Relations received:", Object.keys(relations).length, "products mapped.");
  
  console.log("Saving to Firestore system/recommendations...");
  
  const mapValue = { fields: {} };
  for (const [k, v] of Object.entries(relations)) {
    if (Array.isArray(v)) {
      mapValue.fields[k] = {
        arrayValue: {
          values: v.map(id => ({ stringValue: id }))
        }
      };
    }
  }
  
  const payload = {
    fields: {
      relations: { mapValue },
      updatedAt: { integerValue: Date.now().toString() }
    }
  };
  
  const patchRes = await fetch(`${baseUrl}/system/recommendations?key=${key}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (patchRes.ok) {
    console.log("Successfully regenerated and saved recommendations!");
  } else {
    console.error("Failed to save:", await patchRes.text());
  }
}
run().catch(console.error);
