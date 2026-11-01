// Kopieert OCR- en PDF-assets naar /public zodat niets van een CDN geladen
// wordt (privacy + CSP). Draait automatisch bij postinstall.
import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const nm = "node_modules";
const out = join("public", "vendor");
mkdirSync(join(out, "tesseract", "lang"), { recursive: true });
mkdirSync(join(out, "pdfjs"), { recursive: true });

cpSync(join(nm, "tesseract.js/dist/worker.min.js"), join(out, "tesseract/worker.min.js"));
for (const f of ["tesseract-core-simd-lstm.wasm.js", "tesseract-core-lstm.wasm.js", "tesseract-core-simd-lstm.wasm", "tesseract-core-lstm.wasm"]) {
  cpSync(join(nm, "tesseract.js-core", f), join(out, "tesseract", f));
}
cpSync(join(nm, "@tesseract.js-data/nld/4.0.0_best_int/nld.traineddata.gz"), join(out, "tesseract/lang/nld.traineddata.gz"));
cpSync(join(nm, "pdfjs-dist/build/pdf.worker.min.mjs"), join(out, "pdfjs/pdf.worker.min.mjs"));
console.log("assets gekopieerd naar public/vendor");
