sed -i '625,635c\
      if (existing && existing.quantity + delta <= 0) {\
        setCrossSellSource(null);\
      }\
    }\
\
    setCart((prev) => {\
      if (product && product.isAvailable === false && delta > 0) {\
        return prev; // Block adding out of stock items\
      }' src/App.tsx
