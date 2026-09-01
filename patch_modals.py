import sys

with open("src/App.tsx", "r") as f:
    content = f.read()

modals_def = """
  const adminModals = (
    <>
      {editingCategory && (
        <AdminCategoryModal 
          category={editingCategory === "new" ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => { setEditingCategory(null); fetchData(); }}
        />
      )}
      {editingProduct && (
        <AdminProductModal 
          product={editingProduct === "new" ? null : editingProduct}
          categories={dbCategories}
          onClose={() => setEditingProduct(null)}
          onSaved={() => { setEditingProduct(null); fetchData(); }}
        />
      )}
    </>
  );

"""

# Insert definition before currentView === "order"
content = content.replace('  if (currentView === "order") {', modals_def + '  if (currentView === "order") {')

# Remove old modals block
old_modals = """      {/* Admin Modals */}
      {editingCategory && (
        <AdminCategoryModal 
          category={editingCategory === "new" ? null : editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={() => { setEditingCategory(null); fetchData(); }}
        />
      )}
      {editingProduct && (
        <AdminProductModal 
          product={editingProduct === "new" ? null : editingProduct}
          categories={dbCategories}
          onClose={() => setEditingProduct(null)}
          onSaved={() => { setEditingProduct(null); fetchData(); }}
        />
      )}"""
content = content.replace(old_modals, "      {adminModals}")

# Now inject {adminModals} at the end of each view.
# order view ends around 720. Let's find:
#         )}
#       </div>
#     );
#   }
#   if (currentView === "cart") {

target_1 = """        )}
      </div>
    );
  }

  if (currentView === "cart") {"""
replacement_1 = """        )}
        {adminModals}
      </div>
    );
  }

  if (currentView === "cart") {"""
content = content.replace(target_1, replacement_1)

target_2 = """        </div>
      </div>
    );
  }

  if (currentView === "library") {"""
replacement_2 = """        </div>
        {adminModals}
      </div>
    );
  }

  if (currentView === "library") {"""
content = content.replace(target_2, replacement_2)

target_3 = """          </div>
        )}
      </div>
    );
  }

  if (currentView === "library-summary") {"""
replacement_3 = """          </div>
        )}
        {adminModals}
      </div>
    );
  }

  if (currentView === "library-summary") {"""
content = content.replace(target_3, replacement_3)

target_4 = """          </div>
        </div>
      </div>
    );
  }

  if (currentView === "admin-login") {"""
replacement_4 = """          </div>
        </div>
        {adminModals}
      </div>
    );
  }

  if (currentView === "admin-login") {"""
content = content.replace(target_4, replacement_4)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Patched App.tsx!")
