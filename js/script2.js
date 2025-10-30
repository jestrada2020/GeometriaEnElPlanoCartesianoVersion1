// --- CÓDIGO ESPECÍFICO PARA DETERMINANTES POR OPERACIONES DE FILA ---
        // Estas funciones parseNumberInputDet y formatNumberForLatexDet son específicas para Determinantes.
        // Si quisieras unificarlo todo con app.Fraction, habría que adaptar más aquí.
        let detMatrix = []; 
        let detHistory = []; 
        let detMatrixSize = 2;
        let detOverallFactor = 1; 
        
        function initializeDeterminantTool() {
            detMatrixSize = parseInt(document.getElementById('matrixSizeDet').value) || 2;
            resetMatrixInternalDet();
            updateDetOperationInputs(); 
            renderDeterminantMatrix();
            updateDetLatexProcessDisplay();
            document.getElementById('undoDetButton').disabled = true;
            document.getElementById('finalDeterminantResult').style.display = 'none';
            document.getElementById('finalDeterminantResult').textContent = '';
        }
        
        function resetMatrixInternalDet() { // Renombrado para evitar conflictos
            detMatrix = Array(detMatrixSize).fill(null).map(() => Array(detMatrixSize).fill(0));
            for(let i=0; i<detMatrixSize; i++) { 
            for(let j=0; j<detMatrixSize; j++) { 
                detMatrix[i][j] = (i===j)? i+1 : 0; 
            } 
            }
            detHistory = [];
            detOverallFactor = 1;
        }
        
        function updateDetSize() {
            const newSize = parseInt(document.getElementById('matrixSizeDet').value);
            if (newSize >= 1 && newSize <= 6) {
            detMatrixSize = newSize;
            initializeDeterminantTool(); 
            } else {
            alert('El tamaño de la matriz debe estar entre 1 y 6.');
            document.getElementById('matrixSizeDet').value = detMatrixSize; 
            }
        }
        
        function resetDetMatrix() {
            initializeDeterminantTool();
        }
        
        function renderDeterminantMatrix() {
            const container = document.getElementById('matrixInputDet');
            container.innerHTML = ''; 
            
            for (let i = 0; i < detMatrixSize; i++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'matrix-row-det';
            for (let j = 0; j < detMatrixSize; j++) {
                const cellDiv = document.createElement('div');
                cellDiv.className = 'matrix-cell-det';
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'number-input';
                input.value = formatNumberForInputDet(detMatrix[i][j]); // Usa función específica
                input.dataset.row = i;
                input.dataset.col = j;
                input.onchange = (e) => {
                const r = parseInt(e.target.dataset.row);
                const c = parseInt(e.target.dataset.col);
                detMatrix[r][c] = parseNumberInputDet(e.target.value); // Usa función específica
                document.getElementById('finalDeterminantResult').style.display = 'none'; 
                };
                cellDiv.appendChild(input);
                rowDiv.appendChild(cellDiv);
            }
            container.appendChild(rowDiv);
            }
        }
        
        // Parsea la entrada para Determinantes (puede ser decimal o fraccion "a/b")
        function parseNumberInputDet(inputStr) {
            inputStr = String(inputStr).trim();
            if (inputStr.includes('/')) {
                const parts = inputStr.split('/');
                const num = parseFloat(parts[0]);
                const den = parseFloat(parts[1]);
                if (!isNaN(num) && !isNaN(den) && den !== 0) {
                    return num / den; // Se guarda como número decimal
                }
                return 0; 
            }
            const num = parseFloat(inputStr);
            return isNaN(num) ? 0 : num;
        }
        
        // Formatea número para input en Determinantes
        function formatNumberForInputDet(num) { 
            if (num === null || num === undefined) return '';
            const tolerance = 1e-9;
            for (let den = 1; den <= 32; den++) { 
                if (Math.abs(num * den - Math.round(num * den)) < tolerance) {
                    const numerator = Math.round(num * den);
                    if (den === 1) return numerator.toString();
                    return `${numerator}/${den}`;
                }
            }
            return Number(num.toFixed(4)); 
        }

        // Formatea número para LaTeX en Determinantes (intenta convertir a fracción "bonita")
        function formatNumberForLatexDet(num) {
            if (num === null || num === undefined) return '0';
            if (Number.isInteger(num)) return num.toString();
            
            const tolerance = 1.0E-9; 
            let sign = num < 0 ? -1 : 1;
            num = Math.abs(num);
            
            let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
            let b = num;
            do {
                let a = Math.floor(b);
                let aux = h1; h1 = a * h1 + h2; h2 = aux;
                aux = k1; k1 = a * k1 + k2; k2 = aux;
                b = 1 / (b - a);
            } while (Math.abs(num - h1 / k1) > num * tolerance && k1 <= 1000 && b !== Infinity); 

            if (k1 !== 0 && k1 <= 1000 && Math.abs(num - h1 / k1) <= num * tolerance * Math.abs(num) ) { // Ajuste en tolerancia
                if (k1 === 1) return (sign * h1).toString();
                return (sign < 0 ? "-" : "") + `\\frac{${h1}}{${k1}}`;
            }
            
            let decimalStr = (sign * num).toFixed(3); 
            decimalStr = decimalStr.replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.0+$/, '');
            return decimalStr;
        }

        function calculateRecursiveDeterminant(matrixToCalc) {
            const n = matrixToCalc.length;
            if (n === 0) return 0; 
            if (n === 1) return matrixToCalc[0][0];
            
            let det = 0;
            if (n === 2) {
                return matrixToCalc[0][0] * matrixToCalc[1][1] - matrixToCalc[0][1] * matrixToCalc[1][0];
            }

            for (let j = 0; j < n; j++) {
                const subMatrix = matrixToCalc.slice(1).map(row => 
                    row.filter((_, colIndex) => colIndex !== j)
                );
                det += ((j % 2 === 0) ? 1 : -1) * matrixToCalc[0][j] * calculateRecursiveDeterminant(subMatrix);
            }
            return det;
        }
        
        function updateDetLatexProcessDisplay(finalCalcResult = null) {
            const processDiv = document.getElementById('determinantProcessDet');
            let latexString = `\\begin{align*}\n`;
            
            if (detHistory.length === 0) {
                const initialMatrixLatex = detMatrix.map(row => row.map(formatNumberForLatexDet).join(' & ')).join(' \\\\ ');
                latexString += `\\det(A_0) &= \\begin{vmatrix} ${initialMatrixLatex} \\end{vmatrix}`;
                if (finalCalcResult !== null) { 
                    latexString += ` = ${formatNumberForLatexDet(finalCalcResult.value)} \\\\`;
                }
            } else {
                const firstState = detHistory[0];
                const initialMatrixLatex = firstState.matrixStateBefore.map(row => row.map(formatNumberForLatexDet).join(' & ')).join(' \\\\ ');
                latexString += `\\det(A_0) &= \\begin{vmatrix} ${initialMatrixLatex} \\end{vmatrix} \\\\\n`;

                detHistory.forEach((step, index) => {
                    const matrixLatex = step.matrixStateAfter.map(row => row.map(formatNumberForLatexDet).join(' & ')).join(' \\\\ ');
                    let factorDisplay = "";
                    if (step.overallFactor !== 1) {
                        factorDisplay = formatNumberForLatexDet(step.overallFactor);
                        if (step.overallFactor < 0 && !factorDisplay.startsWith("(") && factorDisplay.includes("-")) { // Evitar doble parentesis si formatNumber ya lo hizo
                             factorDisplay = `(${factorDisplay})`; 
                        }
                    }
                    latexString += `&= ${factorDisplay} \\begin{vmatrix} ${matrixLatex} \\end{vmatrix} && \\text{${step.operationText}} \\\\\n`;
                });
            }

            if (finalCalcResult !== null) {
                if (detHistory.length > 0) { 
                    const lastStepOverallFactor = detHistory[detHistory.length - 1].overallFactor;
                    if (lastStepOverallFactor !== 1) {
                    latexString += `&= ${formatNumberForLatexDet(lastStepOverallFactor)} \\cdot (${formatNumberForLatexDet(finalCalcResult.detOfCurrentMatrix)}) \\\\\n`;
                    }
                }
                latexString += `&= ${formatNumberForLatexDet(finalCalcResult.value)}\n`;
            }

            latexString += `\\end{align*}`;
            processDiv.innerHTML = `\\[${latexString}\\]`;
            if (typeof MathJax !== "undefined" && MathJax.Hub) {
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, processDiv]);
            }
        }

        function updateDetOperationInputs() {
            const container = document.getElementById('operationInputsDet');
            const operationType = document.getElementById('operationTypeDet').value;
            container.innerHTML = ''; 
            
            const rowOptions = Array.from({length: detMatrixSize}, (_, i) => 
                                        `<option value="${i}">Fila ${i + 1}</option>`
            ).join('');
            
            let htmlContent = '';
            switch (operationType) {
                case 'swap':
                htmlContent = `
                <div><label for="row1_det">Fila 1:</label><select id="row1_det" class="operation-selector">${rowOptions}</select></div>
                    <div><label for="row2_det">Fila 2:</label><select id="row2_det" class="operation-selector">${rowOptions}</select></div>
                    `;
                    break;
                case 'multiply':
                htmlContent = `
                <div><label for="rowToMultiply_det">Fila a multiplicar:</label><select id="rowToMultiply_det" class="operation-selector">${rowOptions}</select></div>
                    <div><label for="scalar_det">Escalar (k):</label><input type="text" id="scalar_det" class="number-input" placeholder="Ej: 2, -1/3, 0.5"></div>
                    `;
                    break;
                case 'add': 
                htmlContent = `
                <div><label for="targetRow_det">Fila Destino (Fᵢ):</label><select id="targetRow_det" class="operation-selector">${rowOptions}</select></div>
                <div><label for="addScalar_det">Escalar (k):</label><input type="text" id="addScalar_det" class="number-input" placeholder="Ej: 1, -2, 1/2"></div>
                <div><label for="sourceRow_det">Fila Fuente (Fⱼ):</label><select id="sourceRow_det" class="operation-selector">${rowOptions}</select></div>
                `;
                break;
            }
            container.innerHTML = htmlContent;
        }

        function applyDetOperation() {
            const operationType = document.getElementById('operationTypeDet').value;
            let operationText = '';
            let factorChange = 1; 
            
            const matrixBeforeOp = JSON.parse(JSON.stringify(detMatrix)); 
            
            try {
                switch (operationType) {
                case 'swap':
                    const r1 = parseInt(document.getElementById('row1_det').value);
                    const r2 = parseInt(document.getElementById('row2_det').value);
                    if (r1 === r2) { alert("Seleccione filas diferentes para intercambiar."); return; }
                    [detMatrix[r1], detMatrix[r2]] = [detMatrix[r2], detMatrix[r1]];
                    operationText = `F_{${r1+1}} \\leftrightarrow F_{${r2+1}}`;
                    factorChange = -1;
                    break;
                case 'multiply':
                    const rowMul = parseInt(document.getElementById('rowToMultiply_det').value);
                    const scalar = parseNumberInputDet(document.getElementById('scalar_det').value);
                    if (isNaN(scalar)) { alert("Escalar inválido."); return; }
                    detMatrix[rowMul] = detMatrix[rowMul].map(val => val * scalar);
                    operationText = `${formatNumberForLatexDet(scalar)} F_{${rowMul+1}} \\rightarrow F_{${rowMul+1}}`;
                    factorChange = scalar;
                    break;
                case 'add':
                    const targetR = parseInt(document.getElementById('targetRow_det').value);
                    const scalarAdd = parseNumberInputDet(document.getElementById('addScalar_det').value);
                    const sourceR = parseInt(document.getElementById('sourceRow_det').value);
                    if (isNaN(scalarAdd)) { alert("Escalar inválido."); return; }
                    if (targetR === sourceR) { alert("La fila fuente y destino no pueden ser la misma para esta operación si k != 0 (o trivial)."); return; }
                    
                    detMatrix[targetR] = detMatrix[targetR].map((val, col) => val + scalarAdd * detMatrix[sourceR][col]);
                    let scalarFormatted = formatNumberForLatexDet(scalarAdd);
                    if (scalarAdd < 0 && !scalarFormatted.startsWith("(") && scalarFormatted.includes("-")) scalarFormatted = `(${scalarFormatted})`;
                    operationText = `F_{${targetR+1}} + ${scalarFormatted} F_{${sourceR+1}} \\rightarrow F_{${targetR+1}}`;
                    factorChange = 1; 
                    break;
                }

                if (factorChange === 0) { 
                    detOverallFactor = 0; 
                } else {
                    detOverallFactor /= factorChange;
                }

                detHistory.push({
                    matrixStateBefore: matrixBeforeOp,
                    matrixStateAfter: JSON.parse(JSON.stringify(detMatrix)), 
                    operationText: operationText,
                    factorChange: factorChange, 
                    overallFactor: detOverallFactor 
                });

                renderDeterminantMatrix(); 
                updateDetLatexProcessDisplay(); 
                document.getElementById('undoDetButton').disabled = false;
                document.getElementById('finalDeterminantResult').style.display = 'none'; 
            } catch (error) {
                console.error("Error applying operation:", error);
                alert("Error al aplicar la operación: " + error.message);
            }
        }

        function undoLastDetOperation() {
            if (detHistory.length > 0) {
                const lastStep = detHistory.pop();
                detMatrix = JSON.parse(JSON.stringify(lastStep.matrixStateBefore)); 
                
                if (detHistory.length > 0) {
                    detOverallFactor = detHistory[detHistory.length-1].overallFactor;
                } else {
                    detOverallFactor = 1; 
                }

                renderDeterminantMatrix();
                updateDetLatexProcessDisplay();
                document.getElementById('finalDeterminantResult').style.display = 'none';
            }
            document.getElementById('undoDetButton').disabled = detHistory.length === 0;
        }

        function calculateFinalDeterminant() {
            const detOfCurrentMatrix = calculateRecursiveDeterminant(detMatrix);
            const finalDeterminantValue = detOverallFactor * detOfCurrentMatrix;

            const resultDisplay = document.getElementById('finalDeterminantResult');
            resultDisplay.textContent = `Determinante Final = ${formatNumberForLatexDet(finalDeterminantValue)}`;
            resultDisplay.style.display = 'block';
            
            updateDetLatexProcessDisplay({ value: finalDeterminantValue, detOfCurrentMatrix: detOfCurrentMatrix });
        }

        // --- FIN CÓDIGO DETERMINANTES ---