
        // --- FUNCIONES PARA SUMA DE MATRICES (MODIFICADO PARA FRACCIONES) ---
        function generateMatrixInputsSum() {
            const rows = parseInt(document.getElementById('rowsSum').value);
            const cols = parseInt(document.getElementById('colsSum').value);
            let inputsHTML = `<div class="row"><div class="col-md-6"><h3>Matriz A</h3><div class="matrix-container" style="display: grid; grid-template-columns: repeat(${cols}, auto); gap: 5px;">`;
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    // MODIFICADO: type="text" y clase matrix-entry-cell
                    inputsHTML += `<input type="text" class="form-control text-center matrix-entry-cell" id="matrixA-${i}-${j}" placeholder="A[${i+1},${j+1}]" value="${Math.floor(Math.random()*10)}">`;
                }
            }
            inputsHTML += `</div></div><div class="col-md-6"><h3>Matriz B</h3><div class="matrix-container" style="display: grid; grid-template-columns: repeat(${cols}, auto); gap: 5px;">`;
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    // MODIFICADO: type="text" y clase matrix-entry-cell
                    inputsHTML += `<input type="text" class="form-control text-center matrix-entry-cell" id="matrixB-${i}-${j}" placeholder="B[${i+1},${j+1}]" value="${Math.floor(Math.random()*10)}">`;
                }
            }
            inputsHTML += "</div></div></div>";
            document.getElementById('matrix-inputs-sum').innerHTML = inputsHTML;
        }

        function calculateSum() {
            const rows = parseInt(document.getElementById('rowsSum').value);
            const cols = parseInt(document.getElementById('colsSum').value);
            // MODIFICADO: parsear escalares como fracciones
            const scalarA_val = app.parseFraction(document.getElementById('scalarA').value);
            const scalarB_val = app.parseFraction(document.getElementById('scalarB').value);
            
            let matrixA = [], matrixB = [], scaledMatrixA = [], scaledMatrixB = [], sumMatrix = [];

            for (let i = 0; i < rows; i++) {
                matrixA[i] = []; matrixB[i] = []; scaledMatrixA[i] = []; scaledMatrixB[i] = []; sumMatrix[i] = [];
                for (let j = 0; j < cols; j++) {
                    // MODIFICADO: parsear elementos como fracciones
                    matrixA[i][j] = app.parseFraction(document.getElementById(`matrixA-${i}-${j}`).value);
                    matrixB[i][j] = app.parseFraction(document.getElementById(`matrixB-${i}-${j}`).value);
                    
                    // MODIFICADO: usar multiplicación de fracciones
                    scaledMatrixA[i][j] = app.multiplyFractions(matrixA[i][j], scalarA_val);
                    scaledMatrixB[i][j] = app.multiplyFractions(matrixB[i][j], scalarB_val);
                    
                    // MODIFICADO: usar suma de fracciones
                    sumMatrix[i][j] = app.addFractions(scaledMatrixA[i][j], scaledMatrixB[i][j]);
                }
            }
            const latexOutput = `\\begin{align*}
                A &= ${matrixToLatexGen(matrixA)}, \\quad B = ${matrixToLatexGen(matrixB)} \\\\
                ${app.formatFractionForLatex(scalarA_val)}A &= ${matrixToLatexGen(scaledMatrixA)}, \\quad ${app.formatFractionForLatex(scalarB_val)}B = ${matrixToLatexGen(scaledMatrixB)} \\\\
                ${app.formatFractionForLatex(scalarA_val)}A + ${app.formatFractionForLatex(scalarB_val)}B &= ${matrixToLatexGen(sumMatrix)}
            \\end{align*}`;
            document.getElementById('matrix-sum-result-latex').innerHTML = `\\[${latexOutput}\\]`;
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "matrix-sum-result-latex"]);
        }
        
        // --- FUNCIONES PARA PRODUCTO DE MATRICES (MODIFICADO PARA FRACCIONES) ---
        function generateMatrixInputsProd() {
            const rowsA = parseInt(document.getElementById('rowsAProd').value);
            const colsA = parseInt(document.getElementById('colsAProd').value);
            const colsB = parseInt(document.getElementById('colsBProd').value);
            document.getElementById('rowsBProd').value = colsA; 

            let inputsHTML = `<div class="row"><div class="col-md-6"><h3>Matriz A (${rowsA}x${colsA})</h3><div class="matrix-container" style="display: grid; grid-template-columns: repeat(${colsA}, auto); gap: 5px;">`;
            for (let i = 0; i < rowsA; i++) {
                for (let j = 0; j < colsA; j++) {
                    // MODIFICADO: type="text" y clase matrix-entry-cell
                    inputsHTML += `<input type="text" class="form-control text-center matrix-entry-cell" id="matrixAProd-${i}-${j}" placeholder="A[${i+1},${j+1}]" value="${Math.floor(Math.random()*5)}">`;
                }
            }
            inputsHTML += `</div></div><div class="col-md-6"><h3>Matriz B (${colsA}x${colsB})</h3><div class="matrix-container" style="display: grid; grid-template-columns: repeat(${colsB}, auto); gap: 5px;">`;
            for (let i = 0; i < colsA; i++) { 
                for (let j = 0; j < colsB; j++) {
                    // MODIFICADO: type="text" y clase matrix-entry-cell
                    inputsHTML += `<input type="text" class="form-control text-center matrix-entry-cell" id="matrixBProd-${i}-${j}" placeholder="B[${i+1},${j+1}]" value="${Math.floor(Math.random()*5)}">`;
                }
            }
            inputsHTML += "</div></div></div>";
            document.getElementById('matrix-inputs-prod').innerHTML = inputsHTML;
        }

        function calculateProduct() {
            const rowsA = parseInt(document.getElementById('rowsAProd').value);
            const colsA = parseInt(document.getElementById('colsAProd').value);
            const rowsB = colsA; 
            const colsB = parseInt(document.getElementById('colsBProd').value);
            let matrixA = [], matrixB = [];
            // MODIFICADO: Inicializar productMatrix con fracciones cero
            let productMatrix = Array.from({ length: rowsA }, () => Array(colsB).fill(null).map(() => app.Fraction(0, 1)));

            for (let i = 0; i < rowsA; i++) {
                matrixA[i] = [];
                for (let j = 0; j < colsA; j++) matrixA[i][j] = app.parseFraction(document.getElementById(`matrixAProd-${i}-${j}`).value);
            }
            for (let i = 0; i < rowsB; i++) {
                matrixB[i] = [];
                for (let j = 0; j < colsB; j++) matrixB[i][j] = app.parseFraction(document.getElementById(`matrixBProd-${i}-${j}`).value);
            }

            for (let i = 0; i < rowsA; i++) {
                for (let j = 0; j < colsB; j++) {
                    for (let k = 0; k < colsA; k++) {
                        // MODIFICADO: usar suma y producto de fracciones
                        const term = app.multiplyFractions(matrixA[i][k], matrixB[k][j]);
                        productMatrix[i][j] = app.addFractions(productMatrix[i][j], term);
                    }
                }
            }
            
            let latexOutput = `\\begin{align*}
                A &= ${matrixToLatexGen(matrixA)} \\\\
                B &= ${matrixToLatexGen(matrixB)} \\\\
                A \\times B &= ${matrixToLatexGen(productMatrix)}
            \\end{align*}`;
            
            if (rowsA <= 3 && colsB <= 3 && colsA <=3) { 
                for (let i = 0; i < rowsA; i++) {
                    for (let j = 0; j < colsB; j++) {
                        let cellCalc = `\\[ (A \\times B)_{${i+1},${j+1}} = `;
                        for (let k = 0; k < colsA; k++) {
                            // MODIFICADO: usar app.formatFractionForLatex
                            cellCalc += `${app.formatFractionForLatex(matrixA[i][k])} \\cdot ${app.formatFractionForLatex(matrixB[k][j])}`;
                            if (k < colsA - 1) cellCalc += " + ";
                        }
                        cellCalc += ` = ${app.formatFractionForLatex(productMatrix[i][j])} \\]`;
                        latexOutput += cellCalc;
                    }
                }
            }
                
            document.getElementById('matrix-product-result-latex').innerHTML = `\\[${latexOutput}\\]`;
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "matrix-product-result-latex"]);
        }

        // --- FUNCIONES PARA POTENCIA DE MATRICES (MODIFICADO PARA FRACCIONES) ---
        function generateMatrixInputsPow() {
            const size = parseInt(document.getElementById('sizePow').value);
            let inputsHTML = `<h3>Matriz (${size}x${size})</h3><div class="matrix-container" style="display: grid; grid-template-columns: repeat(${size}, auto); gap: 5px; max-width: ${size*70}px; margin:auto;">`; // Aumentado max-width
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                     // MODIFICADO: type="text" y clase matrix-entry-cell
                    inputsHTML += `<input type="text" class="form-control text-center matrix-entry-cell" id="matrixPow-${i}-${j}" placeholder="M[${i+1},${j+1}]" value="${Math.floor(Math.random()*3)}">`;
                }
            }
            inputsHTML += "</div>";
            document.getElementById('matrix-inputs-pow').innerHTML = inputsHTML;
        }
        
        // MODIFICADO: para operar con fracciones
        function multiplyMatricesGen(A_frac, B_frac) {
            // MODIFICADO: Inicializar C con fracciones cero
            let C_frac = Array(A_frac.length).fill(0).map(() => Array(B_frac[0].length).fill(null).map(() => app.Fraction(0, 1)));
            for (let i = 0; i < A_frac.length; i++) {
                for (let j = 0; j < B_frac[0].length; j++) {
                    for (let k = 0; k < B_frac.length; k++) {
                        const term = app.multiplyFractions(A_frac[i][k], B_frac[k][j]);
                        C_frac[i][j] = app.addFractions(C_frac[i][j], term);
                    }
                }
            }
            return C_frac;
        }
        
        // MODIFICADO: para operar con fracciones
        function matrixPower(matrix_frac, p) {
            if (p === 0) { 
                // MODIFICADO: Matriz identidad con fracciones
                return matrix_frac.map((row, i) => row.map((_, j) => (i === j ? app.Fraction(1, 1) : app.Fraction(0, 1))));
            }
            if (p === 1) return matrix_frac;
            let result_frac = matrix_frac;
            for (let k = 1; k < p; k++) result_frac = multiplyMatricesGen(result_frac, matrix_frac); // Usa la versión modificada
            return result_frac;
        }
        
        function calculatePower() {
            const size = parseInt(document.getElementById('sizePow').value);
            const power = parseInt(document.getElementById('powerPow').value);
            let matrix_frac = [];
            for (let i = 0; i < size; i++) {
                matrix_frac[i] = [];
                // MODIFICADO: parsear elementos como fracciones
                for (let j = 0; j < size; j++) matrix_frac[i][j] = app.parseFraction(document.getElementById(`matrixPow-${i}-${j}`).value);
            }
            let resultMatrix_frac = matrixPower(matrix_frac, power); // Usa la versión modificada
            
            let latexOutput = `\\begin{align*}
                M &= ${matrixToLatexGen(matrix_frac)} \\\\
                M^{${power}} &= ${matrixToLatexGen(resultMatrix_frac)}
            \\end{align*}`;
            
            if (power > 1 && power <= 4) {
                latexOutput += "\\[\\text{Cálculo paso a paso:}\\]";
                let intermediate_frac = matrix_frac;
                latexOutput += `\\[ M^1 = ${matrixToLatexGen(matrix_frac)} \\]`;
                for (let p_step = 2; p_step <= power; p_step++) {
                    intermediate_frac = multiplyMatricesGen(intermediate_frac, matrix_frac); // Usa la versión modificada
                    latexOutput += `\\[ M^${p_step} = ${matrixToLatexGen(intermediate_frac)} \\]`;
                }
            }
            
            document.getElementById('matrix-pow-result-latex').innerHTML = `\\[${latexOutput}\\]`;
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "matrix-pow-result-latex"]);
        }

        // Función genérica para convertir matriz a LaTeX (usada por Suma, Producto, Potencia)
        // MODIFICADO: ahora usa app.formatFractionForLatex
        function matrixToLatexGen(matrix) {
            if (!matrix || matrix.length === 0) return '\\begin{pmatrix} \\end{pmatrix}';
            return `\\begin{pmatrix} ${matrix.map(row => row.map(val => app.formatFractionForLatex(val)).join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
        }

        // Inicialización al cargar la página
        document.addEventListener('DOMContentLoaded', () => {
            MathJax.Hub.Config({
                tex2jax: { inlineMath: [['$', '$']], displayMath: [['$$', '$$']] },
                CommonHTML: { linebreaks: { automatic: true } },
                "HTML-CSS": { linebreaks: { automatic: true } },
                SVG: { linebreaks: { automatic: true } },
                TeX: {Macros: {bm: "\\boldsymbol"}} 
            });
            app.loadTool('introduccion1'); 
        });