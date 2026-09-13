const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Buy Again
const p1 = `<p className="text-[10px] text-gray-500 mt-1 truncate">
                              {product.unit ? product.unit : product.category}
                            </p>`;
code = code.replaceAll(p1, '');

// productElement
const p2 = `<p className="text-[10px] text-gray-500 mt-1 truncate">
                          {prod.unit ? prod.unit : prod.category}
                        </p>`;
code = code.replaceAll(p2, '');

fs.writeFileSync('src/App.tsx', code);
