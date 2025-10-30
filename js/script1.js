const app = {
            currentTool: null,

            // --- NUEVO: Utilidades de Fracciones (movidas y generalizadas desde gaussJordan) ---
            gcd: function(a, b) {
                a = Math.abs(a);
                b = Math.abs(b);
                if (b === 0) return a;
                while(b) [a, b] = [b, a % b];
                return a;
            },

            // ===== ALTERNATIVAS CSS GRID Y SVG PARA CASES =====
            
            // Función para crear ecuaciones con CSS Grid (alternativa a \begin{cases})
            casesGrid: function(equations, containerId) {
                const html = `<div class="cases-grid">
                    <div class="cases-grid-content">
                        ${equations.map(eq => `<span class="cases-eq">${eq}</span>`).join('')}
                    </div>
                </div>`;
                if (containerId) {
                    const container = document.getElementById(containerId);
                    if (container) container.innerHTML = html;
                }
                return html;
            },

            // Función para crear ecuaciones con SVG (alternativa a \begin{cases})
            casesSVG: function(equations, containerId) {
                const height = equations.length * 30 + 20;
                const midPoint = height / 2;
                const html = `<div class="cases-svg">
                    <svg class="cases-svg-brace" viewBox="0 0 20 ${height}" preserveAspectRatio="none">
                        <path d="M3,3 Q3,3 3,${midPoint-8} Q16,${midPoint} 3,${midPoint+8} L3,${height-3} Q3,${height-3} 3,${height-3}" 
                              stroke="black" stroke-width="2.5" fill="none"/>
                    </svg>
                    <div class="cases-svg-content">
                        ${equations.map(eq => `<div class="cases-row"><span class="cases-equation">${eq}</span></div>`).join('')}
                    </div>
                </div>`;
                if (containerId) {
                    const container = document.getElementById(containerId);
                    if (container) container.innerHTML = html;
                }
                return html;
            },

            // Función mejorada para ecuaciones paramétricas usando alternativas
            formatParametricEquationsAlternative: function(x, y, type = 'grid') {
                const equations = [`x = ${x}`, `y = ${y}`];
                return type === 'svg' ? this.casesSVG(equations) : this.casesGrid(equations);
            },

            // Función para crear ecuaciones paramétricas con contenedor
            parametricEquation: function(x, y, containerId, type = 'grid') {
                const equations = [`x = ${x}`, `y = ${y}`];
                const content = type === 'svg' ? this.casesSVG(equations, containerId) : this.casesGrid(equations, containerId);
                
                if (containerId) {
                    const container = document.getElementById(containerId);
                    if (container) {
                        container.innerHTML = `<div class="parametric-equation-container">${content}</div>`;
                    }
                }
                return content;
            },

            // Función para convertir ecuaciones MathJax existentes a alternativas CSS
            convertMathJaxToCSSAlternative: function(element, preferredType = 'svg') {
                if (!element) return;
                
                // Buscar elementos con ecuaciones paramétricas problemáticas
                const mathElements = element.querySelectorAll('.math, .parametric-equation, [class*="parametric"]');
                
                mathElements.forEach(mathEl => {
                    const content = mathEl.innerHTML;
                    
                    // Detectar patrones de ecuaciones paramétricas
                    const casesPattern = /\\begin\{cases\}\s*([^\\]+)\s*\\\\\s*([^\\]+)\s*\\end\{cases\}/g;
                    const matches = casesPattern.exec(content);
                    
                    if (matches) {
                        const eq1 = matches[1].trim();
                        const eq2 = matches[2].trim();
                        
                        // Limpiar las ecuaciones de caracteres LaTeX problemáticos
                        const cleanEq1 = eq1.replace(/&\s*=\s*/g, ' = ').replace(/\$\$/g, '');
                        const cleanEq2 = eq2.replace(/&\s*=\s*/g, ' = ').replace(/\$\$/g, '');
                        
                        const equations = [cleanEq1, cleanEq2];
                        const replacement = preferredType === 'svg' ? 
                            this.casesSVG(equations) : 
                            this.casesGrid(equations);
                        
                        mathEl.innerHTML = `<div class="parametric-equation-container">${replacement}</div>`;
                        mathEl.classList.add('cases-alternative-applied');
                        
                        console.log('Ecuación convertida a alternativa CSS:', {
                            original: content,
                            equations: equations,
                            type: preferredType
                        });
                    }
                });
            },

            Fraction: function(num = 0, den = 1) {
                if (den === 0) {
                    console.error("Denominator cannot be zero.");
                    // Return a "NaN" like fraction or throw error. Here, defaulting to 0/1 for safety in calcs.
                    num = 0;
                    den = 1;
                }
                const common = this.gcd(num, den);
                num = num / common;
                den = den / common;
                if(den < 0) { // Normalize sign to numerator
                    num = -num;
                    den = -den;
                }
                return { num: num, den: den, toString: function() { return this.den === 1 ? `${this.num}` : `${this.num}/${this.den}`; } };
            },

            parseFraction: function(strInput) {
                let str = String(strInput).trim();
                if (!str) str = "0"; // Default to 0 if empty

                if (str.includes('/')) {
                    const parts = str.split('/');
                    if (parts.length === 2) {
                        const num = parseInt(parts[0], 10); // Usar parseInt para enteros
                        const den = parseInt(parts[1], 10);
                        if (!isNaN(num) && !isNaN(den) && den !== 0) {
                            return this.Fraction(num, den);
                        }
                    }
                    console.warn(`Invalid fraction format: ${strInput}, defaulting to 0.`);
                    return this.Fraction(0, 1); 
                }
                // Si no es fraccion, intentar como numero (puede ser decimal, pero lo convertimos a fraccion)
                const numFloat = parseFloat(str);
                if (isNaN(numFloat)) {
                    console.warn(`Invalid number format: ${strInput}, defaulting to 0.`);
                    return this.Fraction(0,1);
                }
                // Convertir float a fracción (simple, para decimales como 0.5, 0.25)
                // Para una conversión más robusta float->fracción, se necesitaría un algoritmo más complejo (ej. continued fractions)
                // Por ahora, si es entero, es num/1. Si tiene decimales, intentamos hasta 10000 en denominador.
                if (Number.isInteger(numFloat)) {
                    return this.Fraction(numFloat, 1);
                } else {
                    // Intento simple de convertir decimal a fracción
                    let tempDen = 1;
                    let tempNum = numFloat;
                    while (!Number.isInteger(tempNum) && tempDen < 10000) { // Limitar denominador
                        tempNum *= 10;
                        tempDen *= 10;
                    }
                    if (Number.isInteger(tempNum)) {
                        return this.Fraction(Math.round(tempNum), tempDen);
                    }
                    // Si no se pudo convertir bien, se queda como numFloat/1 (puede ser problemático para precisión)
                    console.warn(`Could not precisely convert float ${numFloat} to fraction, using ${numFloat}/1.`);
                    return this.Fraction(numFloat, 1); // Esto podría ser problemático si se esperan fracciones exactas de floats complejos
                }
            },

            addFractions: function(f1, f2) {
                return this.Fraction(
                    f1.num * f2.den + f2.num * f1.den,
                    f1.den * f2.den
                );
            },

            multiplyFractions: function(f1, f2) {
                return this.Fraction(f1.num * f2.num, f1.den * f2.den);
            },
            
            // NUEVO: Formato de fracción para LaTeX, usado por todas las herramientas con fracciones.
            formatFractionForLatex: function(f) {
                if (typeof f !== 'object' || f === null || !('num'in f) || !('den' in f)) {
                     // Si no es un objeto fracción, intentar formatearlo como número (usado por determinante)
                    if (typeof f === 'number') return formatNumberForLatexDet(f); // Llama a la función específica de determinantes
                    return String(f); // Fallback
                }
                if (f.den === 0) return "\\text{Indefinido}";
                if (f.num === 0) return "0";
                if (f.den === 1) return f.num.toString();
                
                // Manejo de números negativos
                const numAbs = Math.abs(f.num);
                const sign = f.num < 0 ? "-" : "";
                
                return `${sign}\\frac{${numAbs}}{${f.den}}`;
            },
            // --- FIN Utilidades de Fracciones ---

            // Función global para re-procesar MathJax mejorada
            // Helper para preparar una cadena LaTeX con el nivel de escape correcto
            prepareLatexString: function(latex) {
                // Reemplazar dobles barras por barras simples en comandos comunes
                // PERO preservar las dobles barras dentro de begin{cases}
                
                // Primero, proteger las dobles barras dentro de cases
                let result = latex;
                
                // Encontrar todas las estructuras begin{cases}...end{cases} y proteger las \\\\ dentro
                const casesRegex = /\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g;
                const protectedCases = [];
                let match;
                let caseIndex = 0;
                
                while ((match = casesRegex.exec(latex)) !== null) {
                    const placeholder = `__PROTECTED_CASES_${caseIndex}__`;
                    protectedCases[caseIndex] = match[0]; // Guardar toda la estructura cases
                    result = result.replace(match[0], placeholder);
                    caseIndex++;
                }
                
                // Ahora aplicar las correcciones normales al texto sin cases
                result = result
                    .replace(/\\\\sqrt/g, '\\sqrt')
                    .replace(/\\\\cos/g, '\\cos')
                    .replace(/\\\\sin/g, '\\sin')
                    .replace(/\\\\cosh/g, '\\cosh')
                    .replace(/\\\\sinh/g, '\\sinh')
                    .replace(/\\\\begin/g, '\\begin')
                    .replace(/\\\\end/g, '\\end')
                    .replace(/\\\\frac/g, '\\frac')
                    .replace(/\\\\operatorname/g, '\\operatorname')
                    .replace(/\\\\left/g, '\\left')
                    .replace(/\\\\right/g, '\\right')
                    .replace(/\\\\\\/g, '\\\\'); // Esta línea ya no afectará a cases
                
                // Restaurar las estructuras cases protegidas
                for (let i = 0; i < protectedCases.length; i++) {
                    result = result.replace(`__PROTECTED_CASES_${i}__`, protectedCases[i]);
                }
                
                return result;
            },

            // Función integral para validar y corregir todas las fórmulas matemáticas
            validateAndFixAllMathFormulas: function(element) {
                if (!element) return;
                
                console.log('Iniciando validación integral de fórmulas matemáticas...');
                
                // Ejecutar todas las validaciones
                this.validateAndFixSqrtFormulas(element);
                this.validateAndFixCasesFormulas(element);
                
                // Validación adicional para comandos matemáticos comunes
                this.validateAndFixCommonMathCommands(element);
                
                console.log('Validación integral completada.');
            },

            // Conversión básica de expresiones sqrt a representación CSS
            convertSqrtToCSS: function(content) {
                if (!content || typeof content !== 'string') return content;
                
                const wrap = (expr) => {
                    const clean = (expr || '').trim();
                    return `<span class="sqrt-symbol">${clean}</span>`;
                };
                
                let result = content;
                result = result.replace(/\$\$\s*\\sqrt\{([^}]+)\}\s*\$\$/g, (_, expr) => wrap(expr));
                result = result.replace(/\$\\sqrt\{([^}]+)\}\$/g, (_, expr) => wrap(expr));
                result = result.replace(/\\sqrt\{([^}]+)\}/g, (_, expr) => wrap(expr));
                result = result.replace(/sqrt\{([^}]+)\}/g, (_, expr) => wrap(expr));
                result = result.replace(/sqrt\(([^)]+)\)/g, (_, expr) => wrap(expr));
                return result;
            },
            
            // Inserta un símbolo de raíz cuadrada usando el estilo CSS personalizado
            insertSqrt: function(expression) {
                const clean = (expression || '').trim();
                return `<span class="sqrt-symbol">${clean}</span>`;
            },
            
            // Validación basada en CSS para expresiones sqrt problemáticas
            validateAndFixSqrtFormulasWithCSS: function(element) {
                if (!element) return;
                
                console.log('validateAndFixSqrtFormulasWithCSS: Processing element', element);
                
                const selectors = [
                    '.math',
                    '.math-equation',
                    '.latex-output',
                    '.inline-math',
                    '.parametric-equation',
                    '[data-math]',
                    '[data-mathjax]',
                    'span[class*="math"]',
                    'span.sqrt-symbol'
                ].join(', ');
                
                const mathElements = element.querySelectorAll(selectors);
                
                mathElements.forEach(node => {
                    if (!node || typeof node.innerHTML !== 'string') return;
                    
                    const classes = Array.from(node.classList || []);
                    const isMathContext = classes.some(cls =>
                        cls.includes('math') ||
                        cls.includes('latex') ||
                        cls.includes('parametric') ||
                        cls.includes('equation')
                    );
                    
                    if (!isMathContext && !node.matches('span.sqrt-symbol')) return;
                    
                    const original = node.innerHTML;
                    if (!original || (!original.includes('sqrt') && !original.includes('\\sqrt'))) return;
                    
                    const converted = this.convertSqrtToCSS(original);
                    if (converted !== original) {
                        node.innerHTML = converted;
                        console.log('Sqrt converted to CSS:', { element: node, original, converted });
                    }
                });
            },

            // Función integral que también incluye conversión a alternativas CSS
            validateAndFixAllMathFormulasWithAlternatives: function(element) {
                if (!element) return;
                
                console.log('Iniciando validación integral con alternativas CSS...');
                
                // Primero intentar las validaciones LaTeX tradicionales
                this.validateAndFixSqrtFormulas(element);
                this.validateAndFixCommonMathCommands(element);
                
                // Si las ecuaciones cases siguen fallando, convertir a alternativas CSS
                setTimeout(() => {
                    this.convertMathJaxToCSSAlternative(element, 'svg');
                }, 100);
                
                console.log('Validación integral con alternativas completada.');
            },

            // Función específica para validar y corregir fórmulas con begin{cases}
            validateAndFixCasesFormulas: function(element) {
                if (!element) return;
                
                // Buscar todas las fórmulas matemáticas
                const mathElements = element.querySelectorAll('.math, .math-equation, .parametric-equation, [class*="math"]');
                
                mathElements.forEach(mathEl => {
                    let content = mathEl.innerHTML;
                    let originalContent = content;
                    
                    // Verificar si contiene begin{cases} en formato crudo o problemático
                    if (content.includes('\\begin{cases}') || content.includes('begin{cases}') || content.includes('\\end{cases}') || content.includes('end{cases}')) {
                        // Limpiar y corregir el formato
                        content = content
                            .replace(/\\\\begin\{cases\}/g, '\\begin{cases}')    // Corregir doble escape
                            .replace(/\\\\end\{cases\}/g, '\\end{cases}')        // Corregir doble escape
                            .replace(/(?<!\\)begin\{cases\}/g, '\\begin{cases}') // Añadir barra si falta
                            .replace(/(?<!\\)end\{cases\}/g, '\\end{cases}')     // Añadir barra si falta
                            .replace(/\\begin\s*\{cases\}/g, '\\begin{cases}')   // Eliminar espacios extra
                            .replace(/\\end\s*\{cases\}/g, '\\end{cases}')       // Eliminar espacios extra
                            .replace(/\\\\cosh/g, '\\cosh')                      // Corregir cosh
                            .replace(/\\\\sinh/g, '\\sinh')                      // Corregir sinh
                            .replace(/(?<!\\)cosh/g, '\\cosh')                   // Añadir barra si falta en cosh
                            .replace(/(?<!\\)sinh/g, '\\sinh');                  // Añadir barra si falta en sinh
                        
                        // Verificar que las estructuras de cases estén bien formadas
                        const beginMatches = (content.match(/\\begin\{cases\}/g) || []).length;
                        const endMatches = (content.match(/\\end\{cases\}/g) || []).length;
                        
                        if (beginMatches !== endMatches) {
                            console.warn('Estructura cases desbalanceada en fórmula matemática, intentando corrección');
                            // Intentar balancear añadiendo end{cases} faltante
                            const difference = beginMatches - endMatches;
                            if (difference > 0) {
                                content += '\\end{cases}'.repeat(difference);
                            }
                        }
                        
                        // Solo actualizar si hubo cambios
                        if (content !== originalContent) {
                            mathEl.innerHTML = content;
                            console.log('Fórmula cases corregida:', originalContent, '->', content);
                        }
                    }
                });
                
                // Re-procesar con MathJax si se hicieron correcciones
                if (typeof MathJax !== "undefined" && MathJax.Hub) {
                    setTimeout(() => {
                        MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
                    }, 50);
                }
            },
            
            // Función para validar y corregir comandos matemáticos comunes
            validateAndFixCommonMathCommands: function(element) {
                if (!element) return;
                
                const mathElements = element.querySelectorAll('.math, .math-equation, .parametric-equation, [class*="math"]');
                
                mathElements.forEach(mathEl => {
                    let content = mathEl.innerHTML;
                    let originalContent = content;
                    
                    // Corregir comandos matemáticos comunes que pueden aparecer sin barra inicial
                    content = content
                        .replace(/(?<!\\)cos\(/g, '\\cos(')      // cos sin barra inicial
                        .replace(/(?<!\\)sin\(/g, '\\sin(')      // sin sin barra inicial
                        .replace(/(?<!\\)tan\(/g, '\\tan(')      // tan sin barra inicial
                        .replace(/(?<!\\)cosh\(/g, '\\cosh(')    // cosh sin barra inicial
                        .replace(/(?<!\\)sinh\(/g, '\\sinh(')    // sinh sin barra inicial
                        .replace(/(?<!\\)tanh\(/g, '\\tanh(')    // tanh sin barra inicial
                        .replace(/(?<!\\)ln\(/g, '\\ln(')        // ln sin barra inicial
                        .replace(/(?<!\\)log\(/g, '\\log(')      // log sin barra inicial
                        .replace(/(?<!\\)exp\(/g, '\\exp(')      // exp sin barra inicial
                        .replace(/(?<!\\)lim\s/g, '\\lim ')      // lim sin barra inicial
                        .replace(/(?<!\\)sum\s/g, '\\sum ')      // sum sin barra inicial
                        .replace(/(?<!\\)int\s/g, '\\int ')      // int sin barra inicial
                        .replace(/(?<!\\)frac\{/g, '\\frac{')    // frac sin barra inicial
                        .replace(/(?<!\\)dfrac\{/g, '\\dfrac{')  // dfrac sin barra inicial
                        .replace(/(?<!\\)left\(/g, '\\left(')    // left sin barra inicial
                        .replace(/(?<!\\)right\)/g, '\\right)')  // right sin barra inicial
                        .replace(/(?<!\\)left\[/g, '\\left[')    // left[ sin barra inicial
                        .replace(/(?<!\\)right\]/g, '\\right]')  // right] sin barra inicial
                        .replace(/(?<!\\)left\{/g, '\\left\\{')  // left{ sin barra inicial
                        .replace(/(?<!\\)right\}/g, '\\right\\}'); // right} sin barra inicial
                    
                    // Corregir espacios problemáticos
                    content = content
                        .replace(/\\\s+([a-zA-Z]+)/g, '\\$1')    // Eliminar espacios después de barras
                        .replace(/([a-zA-Z]+)\s*\{/g, '$1{')     // Eliminar espacios antes de llaves
                        .replace(/\{\s+/g, '{')                  // Eliminar espacios después de llaves de apertura
                        .replace(/\s+\}/g, '}');                // Eliminar espacios antes de llaves de cierre
                    
                    // Solo actualizar si hubo cambios
                    if (content !== originalContent) {
                        mathEl.innerHTML = content;
                        console.log('Comandos matemáticos corregidos:', originalContent, '->', content);
                    }
                });
            },

            // Función específica para validar y corregir fórmulas con sqrt
            validateAndFixSqrtFormulas: function(element) {
                if (!element) return;
                
                console.log('validateAndFixSqrtFormulas: Processing element', element);
                
                const selectors = [
                    '.math',
                    '.math-equation',
                    '.latex-output',
                    '.inline-math',
                    '.parametric-equation',
                    '[data-math]',
                    '[data-mathjax]',
                    'span[class*="math"]',
                    'span.sqrt-symbol'
                ].join(', ');
                
                const mathElements = element.querySelectorAll(selectors);
                
                mathElements.forEach(mathEl => {
                    if (!mathEl || typeof mathEl.innerHTML !== 'string') return;
                    
                    let content = mathEl.innerHTML;
                    const originalContent = content;
                    
                    // Verificar si contiene sqrt en cualquier formato
                    if (content.includes('sqrt') || content.includes('\\sqrt')) {
                        console.log('Found sqrt in content:', content);
                        
                        // Limpiar y corregir el formato - MÁS AGRESIVO
                        content = content
                            .replace(/\\\\sqrt\{/g, '\\sqrt{')        // Corregir doble escape
                            .replace(/\\\\sqrt/g, '\\sqrt')           // Corregir doble escape general
                            .replace(/(?<!\\)sqrt\(/g, '\\sqrt{')     // sqrt( → \sqrt{
                            .replace(/(?<!\\)sqrt\{/g, '\\sqrt{')     // sqrt{ → \sqrt{
                            .replace(/sqrt\s*\(/g, '\\sqrt{')         // sqrt ( → \sqrt{
                            .replace(/\\sqrt\s*\{/g, '\\sqrt{')       // Eliminar espacios extra
                            .replace(/\}\s*\}/g, '}}')               // Corregir llaves dobles
                            .replace(/\\sqrt([^{])/g, '\\sqrt{$1}')   // Añadir llaves si faltan
                            .replace(/\\sqrt\{\}/g, '\\sqrt{0}')      // Corregir sqrt vacío
                            .replace(/\)\s*\+/g, '} + ')             // ) + → } +
                            .replace(/\)\s*-/g, '} - ')              // ) - → } -
                            .replace(/\)\s*=/g, '} = ')              // ) = → } =
                            .replace(/\\sqrt{([^}]*)\)\s*}/g, '\\sqrt{$1}') // Limpiar paréntesis extra en sqrt
                            .replace(/\\sqrt{([^}]*)\(/g, '\\sqrt{$1}');     // Limpiar paréntesis de apertura extra
                        
                        // Validar que las llaves estén balanceadas
                        const openBraces = (content.match(/\{/g) || []).length;
                        const closeBraces = (content.match(/\}/g) || []).length;
                        
                        if (openBraces !== closeBraces) {
                            console.warn('Llaves desbalanceadas en fórmula matemática, intentando corrección');
                            // Intentar balancear añadiendo llaves faltantes al final
                            const difference = openBraces - closeBraces;
                            if (difference > 0) {
                                content += '}'.repeat(difference);
                            }
                        }
                        
                        // Solo actualizar si hubo cambios
                        if (content !== originalContent) {
                            mathEl.innerHTML = content;
                            console.log('Fórmula sqrt corregida:', originalContent, '->', content);
                        }
                    }
                });
                
                // Re-procesar con MathJax si se hicieron correcciones
                if (typeof MathJax !== "undefined" && MathJax.Hub) {
                    setTimeout(() => {
                        MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
                    }, 100); // Increased timeout
                }
            },
            
            // Función específica para crear coordenadas paramétricas con formato correcto
            formatParametricEquations: function(x, y) {
                // Crear la cadena LaTeX con formato específico para ecuaciones paramétricas
                // usando la notación 'cases' (sistema de ecuaciones)
                return `\\begin{cases} 
x &= ${x} \\\\ 
y &= ${y}
\\end{cases}`;
            },
            
            reprocessMathJaxGlobal: function(elements = null) {
                // Si no se especifican elementos, procesar todo el documento
                const elementsToProcess = elements || [document.body];
                
                console.log('reprocessMathJaxGlobal: Processing elements', elementsToProcess);
                
                // Preparar elementos - asegurarse que todas las fórmulas tienen clases adecuadas
                elementsToProcess.forEach(element => {
                    if (element) {
                        // Validar y corregir todas las fórmulas matemáticas
                        this.validateAndFixAllMathFormulas(element);
                        // Validar específicamente sqrt formulas
                        this.validateAndFixSqrtFormulas(element);
                        
                        // Procesar elementos con la clase .math
                        const mathElements = element.querySelectorAll('.math');
                        mathElements.forEach(mathElem => {
                            // Asegurar que el contenido LaTeX está bien formateado
                            const content = mathElem.innerHTML;
                            mathElem.innerHTML = this.prepareLatexString(content);
                        });
                        
                        // Procesar elementos con la clase .latex-output o .parametric-equation
                        const latexElements = element.querySelectorAll('.latex-output, .parametric-equation');
                        latexElements.forEach(latexElem => {
                            const content = latexElem.innerHTML;
                            if (content.includes('$$')) {
                                latexElem.innerHTML = this.prepareLatexString(content);
                            }
                        });
                        
                        // Tratamiento especial para coordenadas paramétricas
                        const parametricElements = element.querySelectorAll('#coordenadasParametricas, #coordenadasParametricasElipse, #coordenadasParametricasHiperbola');
                        parametricElements.forEach(paramElem => {
                            if (paramElem.querySelector('.parametric-equation')) {
                                // Ya tiene la estructura correcta
                                const eqDiv = paramElem.querySelector('.parametric-equation');
                                const content = eqDiv.innerHTML;
                                if (content.includes('$$')) {
                                    eqDiv.innerHTML = this.prepareLatexString(content);
                                }
                            } else if (paramElem.innerHTML.includes('begin{cases}')) {
                                // Necesita estructura - encapsular en un contenedor
                                const content = paramElem.innerHTML;
                                paramElem.innerHTML = `<div class="parametric-equation">${this.prepareLatexString(content)}</div>`;
                            }
                        });
                    }
                });
                
                // Enhanced MathJax processing with better logging
                if (typeof MathJax !== "undefined") {
                    console.log('MathJax detected, processing...');
                    if (MathJax.version && MathJax.version.charAt(0) === '3') {
                        // MathJax versión 3.x
                        console.log('Using MathJax 3.x');
                        MathJax.typesetPromise(elementsToProcess).catch((err) => {
                            console.warn('Error en MathJax 3.x typeset:', err);
                        });
                    } else if (MathJax.Hub) {
                        // MathJax versión 2.x
                        console.log('Using MathJax 2.x');
                        elementsToProcess.forEach(element => {
                            if (element) {
                                console.log('Processing element with MathJax 2.x:', element);
                                MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
                            }
                        });
                    } else if (MathJax.typesetPromise) {
                        // Fallback para MathJax 3.x sin version property
                        console.log('Using MathJax 3.x fallback');
                        MathJax.typesetPromise(elementsToProcess).catch((err) => {
                            console.warn('Error en MathJax typeset fallback:', err);
                        });
                    }
                } else {
                    console.warn('MathJax no está disponible, esperando...');
                    // MathJax no está disponible, intentar después de un delay
                    setTimeout(() => {
                        if (typeof MathJax !== "undefined") {
                            console.log('MathJax now available, retrying...');
                            this.reprocessMathJaxGlobal(elements);
                        } else {
                            console.warn('MathJax no se pudo cargar después del timeout');
                        }
                    }, 1000);
                }
            },

            loadTool: function(tool) {
                // Remove active class from previous button
                if (this.currentTool) {
                    const prevButton = document.querySelector(`#sidebar button[onclick="app.loadTool('${this.currentTool}')"]`);
                    if (prevButton) prevButton.classList.remove('active');
                }
                // Add active class to current button
                const currentButton = document.querySelector(`#sidebar button[onclick="app.loadTool('${tool}')"]`);
                if (currentButton) currentButton.classList.add('active');
                this.currentTool = tool;

                const toolContent = document.getElementById('tool-content');
                let content = '';
                
                if(tool === 'algebraLineal') {
                    content = `
                    <h2 class="mb-4">Álgebra Lineal - Método Gauss-Jordan</h2>
                    <div class="row">
                        <div class="col-md-4">
                            ${this.gaussJordanSidebar()}
                        </div>
                        <div class="col-md-8">
                            ${this.gaussJordanMainPanel()}
                        </div>
                    </div>`;
                    toolContent.innerHTML = content;
                    this.gaussJordan.init();
                } else if(tool === 'distanciaPuntos') {
                    content = `
                    <div class="distancia-puntos-tool">
                        <h2 class="main-title">Distancia Entre Dos Puntos del Plano</h2>
                        
                        <!-- Panel de entrada de datos -->
                        <div class="input-panel">
                            <h3 style="color: #2c3e50; margin-bottom: 20px;">Coordenadas de los Puntos</h3>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <h4 class="point-p0">Punto P₀</h4>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="x0" class="form-label">Coordenada x₀:</label>
                                                <input type="number" id="x0" class="form-control" value="1" step="0.5">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="y0" class="form-label">Coordenada y₀:</label>
                                                <input type="number" id="y0" class="form-control" value="1" step="0.5">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h4 class="point-p1">Punto P₁</h4>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="x1" class="form-label">Coordenada x₁:</label>
                                                <input type="number" id="x1" class="form-control" value="4" step="0.5">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group">
                                                <label for="y1" class="form-label">Coordenada y₁:</label>
                                                <input type="number" id="y1" class="form-control" value="5" step="0.5">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row mt-4">
                                <div class="col-12">
                                    <h4 style="color: #27ae60; margin-bottom: 15px;">Elementos a Mostrar en el Gráfico</h4>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="showHorizontal" checked>
                                        <label class="form-check-label" for="showHorizontal">
                                            Mostrar Cateto Horizontal
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="showVertical" checked>
                                        <label class="form-check-label" for="showVertical">
                                            Mostrar Cateto Vertical
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="showTriangle" checked>
                                        <label class="form-check-label" for="showTriangle">
                                            Mostrar Triángulo Sombreado
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="note mt-3">
                                <strong>Nota:</strong> La distancia directa (hipotenusa en rojo) siempre se muestra.
                            </div>

                            <div class="mt-3 d-flex flex-column flex-sm-row align-items-sm-center gap-2">
                                <button type="button" class="btn btn-primary" id="calculateDistanceBtn">
                                    Calcular y visualizar distancia
                                </button>
                                <div class="distance-summary alert alert-info flex-grow-1 mb-0" id="distanceResultSummary" role="status">
                                    Ingrese coordenadas y pulse el botón para ver la distancia.
                                </div>
                            </div>
                        </div>
                        
                        <!-- Panel de fórmula -->
                        <div class="formula-panel">
                            <h4 style="color: #1976d2;">Fórmula de Distancia Euclidiana:</h4>
                            <div class="math-equation" style="font-size: 18px; text-align: center;">
                                d = <span class="sqrt-symbol">(x₁ - x₀)² + (y₁ - y₀)²</span>
                            </div>
                        </div>
                        
                        <!-- Visualización geométrica -->
                        <h3 style="color: #2c3e50;">Visualización Geométrica</h3>
                        <div class="visualization">
                            <canvas id="distanciaCanvas" width="800" height="600" style="width: 100%; border: 1px solid #dee2e6;"></canvas>
                        </div>
                        
                        <!-- Tabla de resultados -->
                        <h3 style="color: #2c3e50;">Resultados Numéricos</h3>
                        <div class="table-responsive">
                            <table class="results-table" id="resultsTable">
                                <thead>
                                    <tr>
                                        <th>Elemento</th>
                                        <th>Descripción</th>
                                        <th>Valor</th>
                                    </tr>
                                </thead>
                                <tbody id="resultsTableBody">
                                    <!-- Los resultados se generarán dinámicamente -->
                                </tbody>
                            </table>
                        </div>
                    </div>`;
                    toolContent.innerHTML = content;
                    
                    // Apply CSS-based sqrt validation (more reliable than LaTeX)
                    console.log('Applying CSS-based distance sqrt validation...');
                    app.validateAndFixSqrtFormulasWithCSS(toolContent);
                    
                    // Marcar todas las fórmulas como cargando
                    const mathElements = toolContent.querySelectorAll('.math');
                    mathElements.forEach(el => {
                        el.classList.add('formula-loading');
                    });
                    
                    app.distanciaPuntos.init();
                    
                    // Procesar ecuaciones matemáticas con el método global mejorado
                    app.reprocessMathJaxGlobal([toolContent]);
                    
                    // Quitar la clase de cargando después de un tiempo
                    setTimeout(() => {
                        mathElements.forEach(el => {
                            el.classList.remove('formula-loading');
                        });
                    }, 500);
                    
                } else if(tool === 'sistemaRectas') {
                    content = `
                    <div class="sistema-rectas-tool">
                        <h2 class="main-title">Sistemas LN y NL</h2>
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <div class="form-group">
                                    <label for="tipoSistema" class="form-label">Seleccione el sistema:</label>
                                    <select class="form-select" id="tipoSistema">
                                        <option value="rectaCirculo">Recta - Círculo</option>
                                        <option value="rectaParabola">Recta - Parábola</option>
                                        <option value="rectaRecta">Recta - Recta</option>
                                        <option value="rectaElipse">Recta - Elipse</option>
                                        <option value="rectaHiperbola">Recta - Hipérbola</option>
                                        <option value="circuloCirculo">Círculo - Círculo</option>
                                        <option value="circuloParabola">Círculo - Parábola</option>
                                        <option value="circuloElipse">Círculo - Elipse</option>
                                        <option value="circuloHiperbola">Círculo - Hipérbola</option>
                                        <option value="parabolaParabola">Parábola - Parábola</option>
                                        <option value="parabolaElipse">Parábola - Elipse</option>
                                        <option value="parabolaHiperbola">Parábola - Hipérbola</option>
                                        <option value="elipseElipse">Elipse - Elipse</option>
                                        <option value="elipseHiperbola">Elipse - Hipérbola</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mb-4">
                            <div class="col-md-12">
                                <div class="canvas-container">
                                    <canvas id="sistemaRectasCanvas" width="800" height="400"></canvas>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="parameter-panel" id="parametrosRecta">
                                    <h4>Parámetros de la Recta</h4>
                                    <div class="mb-3">
                                        <label for="rectaForma" class="form-label">Forma:</label>
                                        <select class="form-select" id="rectaForma">
                                            <option value="general">General: Ax + By + C = 0</option>
                                            <option value="pendiente">Pendiente: y = mx + b</option>
                                            <option value="punto">Punto-pendiente: y - y₁ = m(x - x₁)</option>
                                        </select>
                                    </div>
                                    <div class="row mb-3" id="rectaGeneralParams">
                                        <div class="col-md-4">
                                            <label for="rectaA" class="form-label">A:</label>
                                            <input type="number" class="form-control" id="rectaA" value="1" step="0.1">
                                        </div>
                                        <div class="col-md-4">
                                            <label for="rectaB" class="form-label">B:</label>
                                            <input type="number" class="form-control" id="rectaB" value="1" step="0.1">
                                        </div>
                                        <div class="col-md-4">
                                            <label for="rectaC" class="form-label">C:</label>
                                            <input type="number" class="form-control" id="rectaC" value="0" step="0.1">
                                        </div>
                                    </div>
                                    <div class="row mb-3" id="rectaPendienteParams" style="display:none;">
                                        <div class="col-md-6">
                                            <label for="rectaM" class="form-label">m (pendiente):</label>
                                            <input type="number" class="form-control" id="rectaM" value="1" step="0.1">
                                        </div>
                                        <div class="col-md-6">
                                            <label for="rectaB" class="form-label">b (intersección y):</label>
                                            <input type="number" class="form-control" id="rectaB2" value="0" step="0.1">
                                        </div>
                                    </div>
                                    <div class="row mb-3" id="rectaPuntoParams" style="display:none;">
                                        <div class="col-md-3">
                                            <label for="rectaX1" class="form-label">x₁:</label>
                                            <input type="number" class="form-control" id="rectaX1" value="0" step="0.1">
                                        </div>
                                        <div class="col-md-3">
                                            <label for="rectaY1" class="form-label">y₁:</label>
                                            <input type="number" class="form-control" id="rectaY1" value="0" step="0.1">
                                        </div>
                                        <div class="col-md-6">
                                            <label for="rectaM2" class="form-label">m (pendiente):</label>
                                            <input type="number" class="form-control" id="rectaM2" value="1" step="0.1">
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="parameter-panel" id="parametrosSecundarios">
                                    <!-- Los parámetros se generarán dinámicamente según el tipo de sistema -->
                                </div>
                            </div>
                        </div>
                        
                        <div class="row mt-4">
                            <div class="col-md-12">
                                <div class="results-panel" id="resultadosSistema">
                                    <h4>Resultados</h4>
                                    <div id="solucionAlgebraica"></div>
                                    <div id="ecuacionesResultado"></div>
                                    <div id="coordenadasInterseccion"></div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    toolContent.innerHTML = content;
                    app.sistemaRectas.init();
                    
                    setTimeout(function() {
                        if (typeof MathJax !== "undefined" && MathJax.Hub) {
                            MathJax.Hub.Queue(["Typeset", MathJax.Hub, toolContent]);
                        }
                    }, 200);
                } else if(tool === 'introduccion1') {
                    content = `
                    <h3>Introducción a la Caja de Herramientas</h3>
                    <p>Hace algún tiempo el profesor Carlos Andrés Escobar Guerra propuso la creación de unas cartillas para los cursos de matemáticas de la facultad de Ciencias y Biotecnología, la elaboración de las cartillas produjo la necesidad de tener las herramientas para desarrollar las actividades de dicha cartilla.</p>
                    <p>Así es que se llegó a la creación de una caja de herramientas donde se encontraran aplicaciones de aritmética, matemáticas I, II y III, y aplicaciones más avanzadas, la caja de herramientas hace más dinámica la clase, hace que los estudiantes adquieran los saberes esenciales más rápidamente, depende del profesor y de los estudiantes no pasar por alto los detalles que conducen a la solución.</p>
                    <p>Para solucionar muchos de los ejercicios y problemas no es necesario ser un gran estudiante en matemáticas, eso sí, debe saber interiorizar, entender los conceptos que ayudan a solucionar el problema y en la caja de herramientas encontrará los instrumentos que le ayudaran a solucionar los problemas; depende del alumno escoger la herramienta adecuada.</p>
                    <p>Otra gran ventaja de esta caja de herramientas es que todas las aplicaciones están reunidas en un solo espacio virtual, pensadas y diseñadas especialmente para responder a las necesidades de nuestros estudiantes.</p>
                    <p>Para su desarrollo, se utilizó tecnologías como R, LaTeX, Flexdashboard, Bookdown, Shiny y GeoGebra. El diseño visual de la página fue trabajado con HTML y CSS, y para hacerla más interactiva y dinámica incorporamos JavaScript.</p>
                    <p>Se puede decir que el equipo de trabajo está conformado por el profesor Carlos Andrés Escobar Guerra, Pablo Andrés Guzmán, John Jairo Estrada Álvarez y Juan Albero Arias Quiceno. Gracias a la invaluable ayuda del profesor de estadística y programación Pablo Andrés Guzmán puesto que él inspiró la creación de un grupo de estudio en el cual compartía sus conocimientos de R, de otros programas y actualmente da su opinión acerca de las nuevas aplicaciones. John Jairo Estrada, el cerebro del proyecto, es el programador de todas las aplicaciones.</p>`;
                    toolContent.innerHTML = content;
                } else if(tool === 'determinantes3') { // Suma
                    content = `
                        <h1 class="mb-4">Suma de Matrices (con Fracciones)</h1>
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <label class="form-label">Filas:</label>
                                <input type="number" id="rowsSum" class="form-control" placeholder="Filas" min="1" value="2">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Columnas:</label>
                                <input type="number" id="colsSum" class="form-control" placeholder="Columnas" min="1" value="2">
                            </div>
                            <div class="col-md-3 d-flex align-items-end">
                                <button class="btn btn-primary w-100" onclick="generateMatrixInputsSum()">Generar Matrices</button>
                            </div>
                        </div>
                        <div id="matrix-inputs-sum" class="mb-3"></div>
                        <div class="row mb-3">
                            <div class="col-md-3">
                                <label class="form-label">Escalar para A (ej: 2, 1/2, -3):</label>
                                <input type="text" id="scalarA" class="form-control" value="1"> <!-- MODIFICADO: type="text" -->
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Escalar para B (ej: 2, 1/2, -3):</label>
                                <input type="text" id="scalarB" class="form-control" value="1"> <!-- MODIFICADO: type="text" -->
                            </div>
                        </div>
                        <button class="btn btn-success mb-3" onclick="calculateSum()">Calcular Suma</button>
                        <div class="latex-output">
                            <strong>Resultado:</strong>
                            <div id="matrix-sum-result-latex"></div>
                        </div>
                        <div class="alert alert-info mt-3">Ingrese números enteros (ej: 5), decimales simples (ej: 0.5 que será 1/2) o fracciones (ej: 3/4, -1/2).</div>`;
                    toolContent.innerHTML = content;
                    generateMatrixInputsSum();
                } else if(tool === 'determinantes4') { // Producto
                    content = `
                        <h2 class="mb-4">Multiplicación de Matrices (con Fracciones)</h2>
                        <div class="row mb-3">
                            <div class="col-md-3"><label class="form-label">Filas (A):</label><input type="number" id="rowsAProd" class="form-control" value="2" min="1"></div>
                            <div class="col-md-3"><label class="form-label">Columnas (A) / Filas (B):</label><input type="number" id="colsAProd" class="form-control" value="2" min="1" onchange="document.getElementById('rowsBProd').value = this.value; generateMatrixInputsProd();"></div>
                            <input type="hidden" id="rowsBProd" value="2">
                            <div class="col-md-3"><label class="form-label">Columnas (B):</label><input type="number" id="colsBProd" class="form-control" value="2" min="1"></div>
                            <div class="col-md-3 d-flex align-items-end"><button class="btn btn-primary w-100" onclick="generateMatrixInputsProd()">Generar Matrices</button></div>
                        </div>
                        <div id="matrix-inputs-prod" class="mb-3"></div>
                        <button class="btn btn-success mb-3" onclick="calculateProduct()">Calcular Producto</button>
                        <div class="latex-output">
                            <strong>Desarrollo del producto:</strong>
                            <div id="matrix-product-result-latex"></div>
                        </div>
                        <div class="alert alert-info mt-3">Ingrese números enteros (ej: 5), decimales simples (ej: 0.5 que será 1/2) o fracciones (ej: 3/4, -1/2).</div>`;
                    toolContent.innerHTML = content;
                    generateMatrixInputsProd();
                } else if(tool === 'determinantes5') { // Potencia
                     content = `
                        <h1 class="mb-4">Potencia de una Matriz (con Fracciones)</h1>
                        <div class="row mb-3">
                            <div class="col-md-4">
                                <label class="form-label">Tamaño (matriz cuadrada):</label>
                                <input type="number" id="sizePow" class="form-control" placeholder="Tamaño" min="1" value="2">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Potencia (entero ≥ 0):</label>
                                <input type="number" id="powerPow" class="form-control" placeholder="Potencia" min="0" value="2">
                            </div>
                            <div class="col-md-4 d-flex align-items-end">
                                <button class="btn btn-primary w-100" onclick="generateMatrixInputsPow()">Generar Matriz</button>
                            </div>
                        </div>
                        <div id="matrix-inputs-pow" class="matrix-container mb-3"></div>
                        <button class="btn btn-success mb-3" onclick="calculatePower()">Calcular Potencia</button>
                        <div class="latex-output">
                            <strong>Resultado:</strong>
                            <div id="matrix-pow-result-latex"></div>
                        </div>
                        <div class="alert alert-info mt-3">Ingrese números enteros (ej: 5), decimales simples (ej: 0.5 que será 1/2) o fracciones (ej: 3/4, -1/2).</div>`;
                    toolContent.innerHTML = content;
                    generateMatrixInputsPow();
                } else if(tool === 'conceptoCirculo') {
                    content = `
                    <div class="circle-tool">
                        <h2 class="main-title">Concepto de Círculo</h2>
                        
                        <div class="row">
                            <div class="col-md-8">
                                <div class="card mb-4">
                                    <div class="card-body">
                                        <h4>Definición como lugar geométrico:</h4>
                                        <p class="mb-3">Se llama círculo al lugar geométrico de todos los puntos $P(x,y)$ que se mueven en 
                                        el plano, de forma que su distancia a un punto fijo $C(h,k)$ (llamado centro) es siempre constante. 
                                        La constante se llama radio $r > 0$.</p>
                                                         <div class="math-equation mb-3">
                            <strong>Definición formal:</strong> 
                            <div class="math-equation">d(P,C) = r</div>
                            <div class="math-equation"><span class="sqrt-symbol">(x-h)² + (y-k)²</span> = r</div>
                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-4">
                                                <label class="form-label">Radio (r):</label>
                                                <input type="number" id="radioCirculo" class="form-control" value="5" min="1" max="20" step="0.5">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Centro h:</label>
                                                <input type="number" id="centroH" class="form-control" value="0" min="-10" max="10" step="0.5">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Centro k:</label>
                                                <input type="number" id="centroK" class="form-control" value="0" min="-10" max="10" step="0.5">
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Parámetro t (movimiento del punto P):</label>
                                                <input type="range" id="parametroT" class="form-range" min="0" max="6.28" step="0.1" value="0">
                                                <span id="valorT">0.0</span> radianes
                                            </div>
                                            <div class="col-md-6">
                                                <button class="btn btn-primary" onclick="app.circulo.animar()">Animar Punto</button>
                                                <button class="btn btn-secondary" onclick="app.circulo.detenerAnimacion()">Detener</button>
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-12">
                                                <canvas id="canvasCirculo" width="600" height="400" style="border: 1px solid #ddd; background: white;"></canvas>
                                            </div>
                                        </div>
                                        
                                        <div class="alert alert-info">
                                            <h6>Información del punto P(x,y):</h6>
                                            <p id="infoPunto">Coordenadas: P(0, 0)<br>Distancia al centro: 0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5>Ecuación del Círculo</h5>
                                        <div id="ecuacionCirculo" class="latex-output mb-3">
                                            <!-- Ecuación se mostrará aquí -->
                                        </div>
                                        
                                        <h6>Coordenadas Paramétricas:</h6>
                                        <div id="coordenadasParametricas" class="latex-output mb-3">
                                            <!-- Coordenadas paramétricas se mostrarán aquí -->
                                        </div>
                                        
                                        <h6>Propiedades:</h6>
                                        <ul class="small">
                                            <li>Radio: <span id="propRadio">5</span></li>
                                            <li>Centro: (<span id="propCentroH">0</span>, <span id="propCentroK">0</span>)</li>
                                            <li>Área: <span id="propArea">78.54</span></li>
                                            <li>Perímetro: <span id="propPerimetro">31.42</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    toolContent.innerHTML = content;
                    app.circulo.init();
                    
                    // Apply CSS-based sqrt validation (more reliable than LaTeX)
                    console.log('Applying CSS-based circle sqrt validation...');
                    app.validateAndFixSqrtFormulasWithCSS(toolContent);
                    
                    // Fallback: Apply LaTeX validation if needed
                    setTimeout(() => {
                        console.log('Applying LaTeX fallback validation...');
                        app.validateAndFixSqrtFormulas(toolContent);
                        app.validateAndFixAllMathFormulasWithAlternatives(toolContent);
                        
                        setTimeout(() => {
                            console.log('Reprocessing MathJax for circle...');
                            app.reprocessMathJaxGlobal();
                        }, 200);
                    }, 100);
                } else if(tool === 'conceptoElipse') {
                    content = `
                    <div class="ellipse-tool">
                        <h2 class="main-title">Concepto de Elipse</h2>
                        
                        <div class="row">
                            <div class="col-md-8">
                                <div class="card mb-4">
                                    <div class="card-body">
                                        <h4>Definición como lugar geométrico:</h4>
                                        <p class="mb-3">Se llama elipse al lugar geométrico de todos los puntos $P(x,y)$ que se mueven en 
                                        el plano, tal que la suma de las distancias de $P(x,y)$ a dos puntos fijos $F_1$ y $F_2$ (llamados focos) es constante.</p>
                                                        <div class="math-equation mb-3">
                            <strong>Definición formal:</strong> 
                            <div class="math-equation">d(P,F₁) + d(P,F₂) = 2a</div>
                            <div class="math-equation"><span class="sqrt-symbol">(x-h+c)² + (y-k)²</span> + <span class="sqrt-symbol">(x-h-c)² + (y-k)²</span> = 2a</div>
                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-3">
                                                <label class="form-label">Semieje mayor (a):</label>
                                                <input type="number" id="semiejeA" class="form-control" value="5" min="1" max="15" step="0.5">
                                            </div>
                                            <div class="col-md-3">
                                                <label class="form-label">Semieje menor (b):</label>
                                                <input type="number" id="semiejeB" class="form-control" value="3" min="1" max="15" step="0.5">
                                            </div>
                                            <div class="col-md-3">
                                                <label class="form-label">Centro h:</label>
                                                <input type="number" id="centroHElipse" class="form-control" value="0" min="-10" max="10" step="0.5">
                                            </div>
                                            <div class="col-md-3">
                                                <label class="form-label">Centro k:</label>
                                                <input type="number" id="centroKElipse" class="form-control" value="0" min="-10" max="10" step="0.5">
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Parámetro t (movimiento del punto P):</label>
                                                <input type="range" id="parametroTElipse" class="form-range" min="0" max="6.28" step="0.1" value="0">
                                                <span id="valorTElipse">0.0</span> radianes
                                            </div>
                                            <div class="col-md-6">
                                                <button class="btn btn-primary" onclick="app.elipse.animar()">Animar Punto</button>
                                                <button class="btn btn-secondary" onclick="app.elipse.detenerAnimacion()">Detener</button>
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-12">
                                                <canvas id="canvasElipse" width="600" height="400" style="border: 1px solid #ddd; background: white;"></canvas>
                                            </div>
                                        </div>
                                        
                                        <div class="alert alert-info">
                                            <h6>Información del punto P(x,y):</h6>
                                            <p id="infoPuntoElipse">Coordenadas: P(0, 0)<br>Suma de distancias a focos: 0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5>Ecuación de la Elipse</h5>
                                        <div id="ecuacionElipse" class="latex-output mb-3">
                                            <!-- Ecuación se mostrará aquí -->
                                        </div>
                                        
                                        <h6>Coordenadas Paramétricas:</h6>
                                        <div id="coordenadasParametricasElipse" class="latex-output mb-3">
                                            <!-- Coordenadas paramétricas se mostrarán aquí -->
                                        </div>
                                        
                                        <h6>Propiedades:</h6>
                                        <ul class="small">
                                            <li>Semieje mayor (a): <span id="propA">5</span></li>
                                            <li>Semieje menor (b): <span id="propB">3</span></li>
                                            <li>Centro: (<span id="propCentroHElipse">0</span>, <span id="propCentroKElipse">0</span>)</li>
                                            <li>Distancia focal (c): <span id="propC">4</span></li>
                                            <li>Excentricidad (e): <span id="propExcentricidad">0.8</span></li>
                                            <li>Área: <span id="propAreaElipse">47.12</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    toolContent.innerHTML = content;
                    app.elipse.init();
                    
                    // Apply CSS-based sqrt validation (more reliable than LaTeX)
                    console.log('Applying CSS-based ellipse sqrt validation...');
                    app.validateAndFixSqrtFormulasWithCSS(toolContent);
                    
                    // Aplicar validación específica para las fórmulas matemáticas de la elipse
                    setTimeout(() => {
                        app.validateElipseFormulas(toolContent);
                        app.validateAndFixAllMathFormulasWithAlternatives(toolContent);
                        // Luego procesar con MathJax
                        setTimeout(() => {
                            app.reprocessMathJaxGlobal();
                        }, 150);
                    }, 50);
                } else if(tool === 'conceptoHiperbola') {
                    content = `
                    <div class="hyperbola-tool">
                        <h2 class="main-title">Concepto de Hipérbola</h2>
                        
                        <div class="row">
                            <div class="col-md-8">
                                <div class="card mb-4">
                                    <div class="card-body">
                                        <h4>Definición como lugar geométrico:</h4>
                                        <p class="mb-3">Se llama hipérbola al lugar geométrico de todos los puntos $P(x,y)$ que se mueven en 
                                        el plano, tal que la diferencia absoluta de las distancias de $P(x,y)$ a dos puntos fijos $F_1$ y $F_2$ (llamados focos) es constante.</p>
                                                         <div class="math-equation mb-3">
                            <strong>Definición formal:</strong> 
                            <div class="math-equation">|d(P,F₁) - d(P,F₂)| = 2a</div>
                            <div class="math-equation">|<span class="sqrt-symbol">(x-h+c)² + (y-k)²</span> - <span class="sqrt-symbol">(x-h-c)² + (y-k)²</span>| = 2a</div>
                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-3">
                                                <label class="form-label">Semieje transverso (a):</label>
                                                <input type="number" id="semiejeAHip" class="form-control" value="3" min="1" max="10" step="0.5">
                                            </div>
                                            <div class="col-md-3">
                                                <label class="form-label">Semieje conjugado (b):</label>
                                                <input type="number" id="semiiejeBHip" class="form-control" value="4" min="1" max="10" step="0.5">
                                            </div>
                                            <div class="col-md-3">
                                                <label class="form-label">Centro h:</label>
                                                <input type="number" id="centroHHiperbola" class="form-control" value="0" min="-5" max="5" step="0.5">
                                            </div>
                                            <div class="col-md-3">
                                                <label class="form-label">Centro k:</label>
                                                <input type="number" id="centroKHiperbola" class="form-control" value="0" min="-5" max="5" step="0.5">
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Parámetro t (movimiento del punto P):</label>
                                                <input type="range" id="parametroTHiperbola" class="form-range" min="-3" max="3" step="0.1" value="1">
                                                <span id="valorTHiperbola">1.0</span>
                                            </div>
                                            <div class="col-md-6">
                                                <button class="btn btn-primary" onclick="app.hiperbola.animar()">Animar Punto</button>
                                                <button class="btn btn-secondary" onclick="app.hiperbola.detenerAnimacion()">Detener</button>
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-12">
                                                <canvas id="canvasHiperbola" width="600" height="400" style="border: 1px solid #ddd; background: white;"></canvas>
                                            </div>
                                        </div>
                                        
                                        <div class="alert alert-info">
                                            <h6>Información del punto P(x,y):</h6>
                                            <p id="infoPuntoHiperbola">Coordenadas: P(0, 0)<br>Diferencia de distancias a focos: 0</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5>Ecuación de la Hipérbola</h5>
                                        <div id="ecuacionHiperbola" class="latex-output mb-3">
                                            <!-- Ecuación se mostrará aquí -->
                                        </div>
                                        
                                        <h6>Coordenadas Paramétricas:</h6>
                                        <div id="coordenadasParametricasHiperbola" class="latex-output mb-3">
                                            <!-- Coordenadas paramétricas se mostrarán aquí -->
                                        </div>
                                        
                                        <h6>Propiedades:</h6>
                                        <ul class="small">
                                            <li>Semieje transverso (a): <span id="propAHip">3</span></li>
                                            <li>Semieje conjugado (b): <span id="propBHip">4</span></li>
                                            <li>Centro: (<span id="propCentroHHiperbola">0</span>, <span id="propCentroKHiperbola">0</span>)</li>
                                            <li>Distancia focal (c): <span id="propCHip">5</span></li>
                                            <li>Excentricidad (e): <span id="propExcentricidadHip">1.667</span></li>
                                            <li>Asíntotas: y = ±<span id="propAsintotasHip">4/3</span>x</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    toolContent.innerHTML = content;
                    app.hiperbola.init();
                    
                    // Apply CSS-based sqrt validation (more reliable than LaTeX)
                    console.log('Applying CSS-based hyperbola sqrt validation...');
                    app.validateAndFixSqrtFormulasWithCSS(toolContent);
                    
                    // Aplicar validación específica para las fórmulas matemáticas de la hipérbola
                    setTimeout(() => {
                        app.validateAndFixSqrtFormulas(toolContent);
                        app.validateAndFixAllMathFormulasWithAlternatives(toolContent);
                        // Luego procesar con MathJax
                        setTimeout(() => {
                            app.reprocessMathJaxGlobal();
                        }, 150);
                    }, 50);
                } else if(tool === 'parabolaVertical') {
                    content = `
                    <div class="parabola-vertical-tool">
                        <h2 class="main-title">Parábolas Verticales</h2>
                        
                        <div class="row">
                            <div class="col-md-8">
                                <div class="card mb-4">
                                    <div class="card-body">
                                        <h4>Definición como lugar geométrico:</h4>
                                        <p class="mb-3">Una parábola vertical es el lugar geométrico de todos los puntos $P(x,y)$ que equidistan de un punto fijo $F$ (foco) y una recta fija $d$ (directriz) horizontal.</p>
                                        
                                        <div class="math-equation mb-3">
                                            <strong>Ecuación general:</strong> 
                                            $$y = Ax^2 + Bx + C$$
                                            <strong>Forma canónica:</strong> 
                                            $$(x - h)^2 = 4p(y - k)$$
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-4">
                                                <label class="form-label">Coeficiente A:</label>
                                                <input type="number" id="coefAParV" class="form-control" value="1" min="-5" max="5" step="0.1">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Coeficiente B:</label>
                                                <input type="number" id="coefBParV" class="form-control" value="0" min="-10" max="10" step="0.1">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Coeficiente C:</label>
                                                <input type="number" id="coefCParV" class="form-control" value="-1" min="-10" max="10" step="0.1">
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Valor de x para evaluar:</label>
                                                <input type="number" id="valorXParV" class="form-control" value="0" min="-10" max="10" step="0.1">
                                                <small>f(<span id="valorXMostrarParV">0</span>) = <span id="resultadoEvalParV">-1</span></small>
                                            </div>
                                            <div class="col-md-6">
                                                <button class="btn btn-primary" onclick="app.parabolaVertical.animar()">Animar Punto</button>
                                                <button class="btn btn-secondary" onclick="app.parabolaVertical.detenerAnimacion()">Detener</button>
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-12">
                                                <canvas id="canvasParabolaVertical" width="600" height="400" style="border: 1px solid #ddd; background: white;"></canvas>
                                            </div>
                                        </div>
                                        
                                        <div class="alert alert-info">
                                            <h6>Información del punto P(x,y):</h6>
                                            <p id="infoPuntoParV">Coordenadas: P(0, -1)<br>Distancia al foco = Distancia a directriz</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5>Ecuación de la Parábola</h5>
                                        <div id="ecuacionParabolaVertical" class="latex-output mb-3">
                                            <!-- Ecuación se mostrará aquí -->
                                        </div>
                                        
                                        <h6>Elementos clave:</h6>
                                        <ul class="small">
                                            <li>Vértice: (<span id="propVerticeHParV">0</span>, <span id="propVerticeKParV">-1</span>)</li>
                                            <li>Foco: (<span id="propFocoHParV">0</span>, <span id="propFocoKParV">-0.75</span>)</li>
                                            <li>Parámetro p: <span id="propPParV">0.25</span></li>
                                            <li>Directriz: y = <span id="propDirectrizParV">-1.25</span></li>
                                            <li>Concavidad: <span id="propConcavidadParV">Hacia arriba</span></li>
                                            <li id="propRaicesParV">Raíces: x = 0</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    toolContent.innerHTML = content;
                    app.parabolaVertical.init();
                    
                    // Forzar procesamiento inicial de MathJax con función global mejorada
                    setTimeout(() => {
                        app.reprocessMathJaxGlobal();
                    }, 300);
                } else if(tool === 'parabolaHorizontal') {
                    content = `
                    <div class="parabola-horizontal-tool">
                        <h2 class="main-title">Parábolas Horizontales</h2>
                        
                        <div class="row">
                            <div class="col-md-8">
                                <div class="card mb-4">
                                    <div class="card-body">
                                        <h4>Definición como lugar geométrico:</h4>
                                        <p class="mb-3">Una parábola horizontal es el lugar geométrico de todos los puntos $P(x,y)$ que equidistan de un punto fijo $F$ (foco) y una recta fija $d$ (directriz) vertical.</p>
                                        
                                        <div class="math-equation mb-3">
                                            <strong>Ecuación general:</strong> 
                                            $$x = Ay^2 + By + C$$
                                            <strong>Forma canónica:</strong> 
                                            $$(y - k)^2 = 4p(x - h)$$
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-4">
                                                <label class="form-label">Coeficiente A:</label>
                                                <input type="number" id="coefAParH" class="form-control" value="1" min="-5" max="5" step="0.1">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Coeficiente B:</label>
                                                <input type="number" id="coefBParH" class="form-control" value="0" min="-10" max="10" step="0.1">
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label">Coeficiente C:</label>
                                                <input type="number" id="coefCParH" class="form-control" value="-1" min="-10" max="10" step="0.1">
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Valor de y para evaluar:</label>
                                                <input type="number" id="valorYParH" class="form-control" value="0" min="-10" max="10" step="0.1">
                                                <small>f(<span id="valorYMostrarParH">0</span>) = <span id="resultadoEvalParH">-1</span></small>
                                            </div>
                                            <div class="col-md-6">
                                                <button class="btn btn-primary" onclick="app.parabolaHorizontal.animar()">Animar Punto</button>
                                                <button class="btn btn-secondary" onclick="app.parabolaHorizontal.detenerAnimacion()">Detener</button>
                                            </div>
                                        </div>
                                        
                                        <div class="row mb-3">
                                            <div class="col-md-12">
                                                <canvas id="canvasParabolaHorizontal" width="600" height="400" style="border: 1px solid #ddd; background: white;"></canvas>
                                            </div>
                                        </div>
                                        
                                        <div class="alert alert-info">
                                            <h6>Información del punto P(x,y):</h6>
                                            <p id="infoPuntoParH">Coordenadas: P(-1, 0)<br>Distancia al foco = Distancia a directriz</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-body">
                                        <h5>Ecuación de la Parábola</h5>
                                        <div id="ecuacionParabolaHorizontal" class="latex-output mb-3">
                                            <!-- Ecuación se mostrará aquí -->
                                        </div>
                                        
                                        <h6>Elementos clave:</h6>
                                        <ul class="small">
                                            <li>Vértice: (<span id="propVerticeHParH">-1</span>, <span id="propVerticeKParH">0</span>)</li>
                                            <li>Foco: (<span id="propFocoHParH">-0.75</span>, <span id="propFocoKParH">0</span>)</li>
                                            <li>Parámetro p: <span id="propPParH">0.25</span></li>
                                            <li>Directriz: x = <span id="propDirectrizParH">-1.25</span></li>
                                            <li>Orientación: <span id="propOrientacionParH">Hacia la derecha</span></li>
                                            <li id="propRaicesParH">Raíces: y = 0</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    toolContent.innerHTML = content;
                    app.parabolaHorizontal.init();
                    
                    // Forzar procesamiento inicial de MathJax con función global mejorada
                    setTimeout(() => {
                        app.reprocessMathJaxGlobal();
                    }, 300);
                } else if(tool === 'determinantes') {
                    content = `
                    <div class="determinant-tool">
                        <h2 class="main-title">Cálculo de Determinantes por Operaciones de Fila</h2>
                        <div class="grid-container">
                            <div class="card">
                                <h3 class="subtitle">1. Configurar Matriz</h3>
                                <div class="mb-3">
                                    <label for="matrixSizeDet" class="form-label">Tamaño (N x N):</label>
                                    <div class="input-group">
                                        <input type="number" id="matrixSizeDet" class="form-control" min="1" max="6" value="2">
                                        <button class="btn btn-primary" onclick="updateDetSize()">Generar</button>
                                    </div>
                                </div>
                                <div id="matrixInputDet" class="matrix-grid-det mb-3"></div>
                                <button class="button button-warning-det mb-2" onclick="resetDetMatrix()">Reiniciar Matriz y Proceso</button>
                                <button class="button button-primary-det" onclick="calculateFinalDeterminant()">Calcular Determinante Final</button>
                                <div id="finalDeterminantResult" class="final-determinant-display" style="display:none;"></div>

                                <div class="info-section-det">
                                    <strong>Instrucciones de entrada:</strong>
                                    <p>Puede ingresar números como enteros (5), decimales (2.5) o fracciones (3/4).</p>
                                </div>
                            </div>

                            <div class="card">
                                <h3 class="subtitle">2. Aplicar Operaciones</h3>
                                <div class="operations-box-det">
                                    <label for="operationTypeDet" class="form-label">Tipo de Operación:</label>
                                    <select id="operationTypeDet" class="operation-selector mb-3" onchange="updateDetOperationInputs()">
                                        <option value="swap">Intercambiar filas (Fᵢ ↔ Fⱼ)</option>
                                        <option value="multiply">Multiplicar fila por escalar (k·Fᵢ → Fᵢ)</option>
                                        <option value="add">Sumar múltiplo de fila a otra (Fᵢ + k·Fⱼ → Fᵢ)</option>
                                    </select>
                                    <div id="operationInputsDet" class="operation-inputs-det mb-3"></div>
                                    <button class="button button-secondary-det" onclick="applyDetOperation()">Aplicar Operación</button>
                                    <button class="button button-danger-det mt-2" onclick="undoLastDetOperation()" id="undoDetButton" disabled>Deshacer Última Operación</button>
                                </div>
                                
                                <div class="properties-section-det">
                                    <h4 class="subtitle" style="font-size: 1.1rem; margin-top:0;">Propiedades de Operaciones y Determinantes</h4>
                                    <div class="property-item-det"><strong>Fᵢ ↔ Fⱼ:</strong> det(B) = -det(A). El determinante cambia de signo.</div>
                                    <div class="property-item-det"><strong>k·Fᵢ → Fᵢ:</strong> det(B) = k·det(A). El determinante se multiplica por k.</div>
                                    <div class="property-item-det"><strong>Fᵢ + k·Fⱼ → Fᵢ:</strong> det(B) = det(A). El determinante no cambia.</div>
                                </div>
                            </div>
                        </div>
                        <div class="card mt-4">
                            <h3 class="subtitle">3. Proceso de Cálculo y Resultado</h3>
                            <div class="process-section-det">
                                <div id="determinantProcessDet" class="latex-process-det">
                                    <p>Ingrese una matriz y aplique operaciones. El proceso se mostrará aquí.</p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    toolContent.innerHTML = content;
                    initializeDeterminantTool();
                } else if(tool === 'g_Geogebra') {
                    content = `
                    <div class="geogebra-tool">
                        <h2 class="main-title">GeoGebra - Herramientas Matemáticas Interactivas</h2>
                        
                        <div class="row mb-4">
                            <div class="col-12">
                                <div class="alert alert-info">
                                    <h5><i class="fas fa-info-circle"></i> Selecciona una aplicación GeoGebra</h5>
                                    <p class="mb-0">Elige entre las diferentes herramientas matemáticas interactivas de GeoGebra para explorar conceptos geométricos, algebraicos y estadísticos.</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-4 mb-4">
                                <div class="card h-100 geogebra-card" onclick="app.loadGeogebraApp('geometry')">
                                    <div class="card-body text-center">
                                        <i class="fas fa-shapes fa-3x mb-3 text-primary"></i>
                                        <h5 class="card-title">GeoGebra Geometría</h5>
                                        <p class="card-text">Herramientas para construcciones geométricas, exploración de formas y visualización de conceptos geométricos.</p>
                                        <div class="badge badge-primary">Geometría Interactiva</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4 mb-4">
                                <div class="card h-100 geogebra-card" onclick="app.loadGeogebraApp('graphing')">
                                    <div class="card-body text-center">
                                        <i class="fas fa-chart-line fa-3x mb-3 text-success"></i>
                                        <h5 class="card-title">GeoGebra Gráficas</h5>
                                        <p class="card-text">Calculadora gráfica para funciones, ecuaciones y exploración algebraica avanzada.</p>
                                        <div class="badge badge-success">Álgebra y Gráficas</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-4 mb-4">
                                <div class="card h-100 geogebra-card" onclick="app.loadGeogebraApp('calculator')">
                                    <div class="card-body text-center">
                                        <i class="fas fa-calculator fa-3x mb-3 text-warning"></i>
                                        <h5 class="card-title">GeoGebra Calculadora</h5>
                                        <p class="card-text">Calculadora científica con capacidades simbólicas y numéricas avanzadas.</p>
                                        <div class="badge badge-warning">Cálculo Científico</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Contenedor para la aplicación GeoGebra -->
                        <div id="geogebra-container" class="mt-4" style="display: none;">
                            <div class="row">
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-header d-flex justify-content-between align-items-center">
                                            <h5 class="mb-0" id="geogebra-title">GeoGebra</h5>
                                            <button class="btn btn-sm btn-secondary" onclick="app.closeGeogebraApp()">
                                                <i class="fas fa-times"></i> Cerrar
                                            </button>
                                        </div>
                                        <div class="card-body p-0">
                                            <div id="geogebra-applet" style="width: 100%; height: 600px;"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Información adicional -->
                        <div class="row mt-4">
                            <div class="col-12">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title"><i class="fas fa-lightbulb text-warning"></i> Consejos de uso</h6>
                                        <ul class="list-unstyled mb-0">
                                            <li><i class="fas fa-check text-success"></i> <strong>Geometría:</strong> Perfecto para construcciones con regla y compás, exploración de propiedades geométricas.</li>
                                            <li><i class="fas fa-check text-success"></i> <strong>Gráficas:</strong> Ideal para graficar funciones, resolver ecuaciones y explorar conceptos de cálculo.</li>
                                            <li><i class="fas fa-check text-success"></i> <strong>Calculadora:</strong> Útil para cálculos simbólicos, resolución de ecuaciones y evaluación de expresiones.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    toolContent.innerHTML = content;
                }
                
                // Mejorado: procesamiento robusto de MathJax para todas las herramientas
                setTimeout(() => {
                    // Validar y corregir todas las fórmulas matemáticas incluyendo alternativas CSS
                    this.validateAndFixAllMathFormulasWithAlternatives(toolContent);
                    
                    if (typeof MathJax !== "undefined") {
                        if (MathJax.Hub) {
                            // MathJax versión 2.x
                            MathJax.Hub.Queue(["Typeset", MathJax.Hub, toolContent]);
                        } else if (MathJax.typesetPromise) {
                            // MathJax versión 3.x
                            MathJax.typesetPromise([toolContent]);
                        }
                    }
                }, 200);
            },
            
            // GeoGebra integration functions
            loadGeogebraApp: function(appType) {
                const container = document.getElementById('geogebra-container');
                const titleElement = document.getElementById('geogebra-title');
                const appletDiv = document.getElementById('geogebra-applet');
                
                // Clear previous applet
                appletDiv.innerHTML = '';
                
                // Show container
                container.style.display = 'block';
                
                // Set title and configure applet based on type
                let appConfig = {};
                
                switch(appType) {
                    case 'geometry':
                        titleElement.innerHTML = '<i class="fas fa-shapes"></i> GeoGebra Geometría';
                        appConfig = {
                            "appName": "geometry",
                            "width": appletDiv.offsetWidth || 800,
                            "height": 600,
                            "showToolBar": true,
                            "showAlgebraInput": true,
                            "showMenuBar": true,
                            "allowStyleBar": true,
                            "allowZoom": true,
                            "language": "es",
                            "country": "ES",
                            "platform": "web"
                        };
                        break;
                        
                    case 'graphing':
                        titleElement.innerHTML = '<i class="fas fa-chart-line"></i> GeoGebra Gráficas';
                        appConfig = {
                            "appName": "graphing",
                            "width": appletDiv.offsetWidth || 800,
                            "height": 600,
                            "showToolBar": true,
                            "showAlgebraInput": true,
                            "showMenuBar": true,
                            "allowStyleBar": true,
                            "allowZoom": true,
                            "language": "es",
                            "country": "ES",
                            "platform": "web"
                        };
                        break;
                        
                    case 'calculator':
                        titleElement.innerHTML = '<i class="fas fa-calculator"></i> GeoGebra Calculadora';
                        appConfig = {
                            "appName": "scientific",
                            "width": appletDiv.offsetWidth || 800,
                            "height": 600,
                            "showToolBar": true,
                            "showAlgebraInput": true,
                            "showMenuBar": false,
                            "allowStyleBar": true,
                            "language": "es",
                            "country": "ES",
                            "platform": "web"
                        };
                        break;
                        
                    default:
                        console.error('Tipo de aplicación GeoGebra no reconocido:', appType);
                        return;
                }
                
                // Load GeoGebra API if not already loaded
                if (typeof GGBApplet === 'undefined') {
                    this.loadGeogebraAPI(() => {
                        this.initializeGeogebraApplet(appConfig);
                    });
                } else {
                    this.initializeGeogebraApplet(appConfig);
                }
                
                // Scroll to the applet
                container.scrollIntoView({ behavior: 'smooth' });
            },
            
            loadGeogebraAPI: function(callback) {
                // Check if GeoGebra API script is already loaded
                if (document.querySelector('script[src*="geogebra"]')) {
                    callback();
                    return;
                }
                
                const script = document.createElement('script');
                script.src = 'https://www.geogebra.org/apps/deployggb.js';
                script.onload = callback;
                script.onerror = () => {
                    console.error('Error loading GeoGebra API');
                    alert('Error al cargar la API de GeoGebra. Verifique su conexión a internet.');
                };
                document.head.appendChild(script);
            },
            
            initializeGeogebraApplet: function(config) {
                try {
                    const applet = new GGBApplet(config, true);
                    applet.inject('geogebra-applet');
                    
                    // Add resize handler
                    window.addEventListener('resize', () => {
                        this.resizeGeogebraApplet();
                    });
                    
                } catch (error) {
                    console.error('Error initializing GeoGebra applet:', error);
                    document.getElementById('geogebra-applet').innerHTML = `
                        <div class="alert alert-danger text-center" style="margin: 50px;">
                            <h5><i class="fas fa-exclamation-triangle"></i> Error de Carga</h5>
                            <p>No se pudo cargar la aplicación GeoGebra. Por favor:</p>
                            <ul class="list-unstyled">
                                <li>• Verifique su conexión a internet</li>
                                <li>• Actualice la página e intente nuevamente</li>
                                <li>• Asegúrese de que JavaScript esté habilitado</li>
                            </ul>
                            <button class="btn btn-primary mt-2" onclick="window.location.reload()">
                                <i class="fas fa-sync-alt"></i> Recargar Página
                            </button>
                        </div>
                    `;
                }
            },
            
            resizeGeogebraApplet: function() {
                // This function can be called to resize the applet if needed
                const appletDiv = document.getElementById('geogebra-applet');
                if (appletDiv && window.ggbApplet) {
                    try {
                        window.ggbApplet.setSize(appletDiv.offsetWidth, 600);
                    } catch (error) {
                        console.log('Resize not available for this applet type');
                    }
                }
            },
            
            closeGeogebraApp: function() {
                const container = document.getElementById('geogebra-container');
                const appletDiv = document.getElementById('geogebra-applet');
                
                // Hide container
                container.style.display = 'none';
                
                // Clear applet
                appletDiv.innerHTML = '';
                
                // Remove any GeoGebra global references
                if (window.ggbApplet) {
                    delete window.ggbApplet;
                }
            },
            
            gaussJordanSidebar: () => `
                <div class="card gj-card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">Dimensiones del Sistema</h5>
                        <div class="row mb-2">
                            <div class="col-6">
                                <label for="gjRows" class="form-label form-label-sm">Filas (Ecuaciones):</label>
                                <input type="number" id="gjRows" class="form-control form-control-sm" value="3" min="1" max="10">
                            </div>
                            <div class="col-6">
                                <label for="gjCols" class="form-label form-label-sm">Columnas (Variables):</label>
                                <input type="number" id="gjCols" class="form-control form-control-sm" value="3" min="1" max="10">
                            </div>
                        </div>
                        <button class="btn btn-sm btn-secondary w-100" onclick="app.gaussJordan.updateDimensions()">Actualizar Dimensiones</button>
                    </div>
                </div>
                <div class="card gj-card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">Matriz Ampliada Inicial</h5>
                        <div id="gjMatrixInputs" class="mb-2"></div>
                        <button class="btn btn-sm btn-primary w-100" onclick="app.gaussJordan.generateMatrix()">Cargar Matriz y Empezar</button>
                    </div>
                </div>
                <div class="card gj-card">
                    <div class="card-body">
                        <h5 class="card-title">Operaciones Elementales de Fila</h5>
                        <div class="mb-2">
                            <label for="gjOperationType" class="form-label form-label-sm">Tipo de operación:</label>
                            <select id="gjOperationType" class="form-select form-select-sm">
                                <option value="multiply">Multiplicar fila por escalar (k·Fᵢ → Fᵢ)</option>
                                <option value="add">Sumar múltiplo de fila a otra (Fᵢ + k·Fⱼ → Fᵢ)</option>
                                <option value="swap">Intercambiar filas (Fᵢ ↔ Fⱼ)</option>
                            </select>
                        </div>
                        <div id="gjOperationInputs"></div> <!-- Inputs for operation params here -->
                        <div class="d-grid gap-2 mt-2">
                            <button class="btn btn-sm btn-success" onclick="app.gaussJordan.applyOperation()">Aplicar Operación</button>
                            <button class="btn btn-sm btn-warning" onclick="app.gaussJordan.undoOperation()">Deshacer Última</button>
                        </div>
                    </div>
                </div>
            `,

            gaussJordanMainPanel: () => `
                <div class="card gj-card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">Matriz Original (A₀)</h5>
                        <div id="gjAugmentedMatrix" class="gj-matrix">Sistema no cargado.</div>
                    </div>
                </div>
                <div class="card gj-card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">Matriz Actual Transformada</h5>
                        <div id="gjCurrentMatrix" class="gj-matrix">Aplique operaciones.</div>
                    </div>
                </div>
                <div class="card gj-card">
                    <div class="card-body">
                        <h5 class="card-title">Historial de Operaciones</h5>
                        <div id="gjOperationHistory" class="gj-history">No hay operaciones realizadas.</div>
                    </div>
                </div>
            `,

            gaussJordan: { // Este objeto contendrá todo lo específico de Gauss-Jordan
                rows: 3,
                cols: 3,
                matrix: [],
                history: [],
                steps: [],

                init() {
                    this.rows = parseInt(document.getElementById('gjRows').value) || 3;
                    this.cols = parseInt(document.getElementById('gjCols').value) || 3;
                    this.renderMatrixInputs();
                    this.renderOperationParameterInputs();
                    const opTypeSelect = document.getElementById('gjOperationType');
                    if (opTypeSelect) {
                        opTypeSelect.addEventListener('change', () => this.renderOperationParameterInputs());
                    }
                    this.updateUI();
                },
                
                updateDimensions() {
                    this.rows = parseInt(document.getElementById('gjRows').value);
                    this.cols = parseInt(document.getElementById('gjCols').value);
                    this.renderMatrixInputs();
                    this.renderOperationParameterInputs();
                    this.matrix = [];
                    this.steps = [];
                    this.history = [];
                    this.updateUI();
                },

                renderMatrixInputs() {
                    const container = document.getElementById('gjMatrixInputs');
                    if (!container) return;
                    container.innerHTML = '';
                    const table = document.createElement('div');
                    table.style.display = 'grid';
                    table.style.gridTemplateColumns = `repeat(${this.cols + 1}, auto)`;
                    table.style.gap = '3px';

                    for(let i = 0; i < this.rows; i++) {
                        for(let j = 0; j <= this.cols; j++) {
                            const input = document.createElement('input');
                            input.type = 'text'; // MODIFICADO: para permitir fracciones
                            input.className = 'form-control form-control-sm matrix-input text-center'; 
                            input.value = (i === j && i < this.cols) ? '1' : '0';
                            if (j === this.cols) input.value = i+1;
                            input.id = `gj_A_${i}_${j}`;
                            table.appendChild(input);
                        }
                    }
                    container.appendChild(table);
                },

                generateMatrix() {
                    this.matrix = [];
                    for(let i = 0; i < this.rows; i++) {
                        const currentRow = [];
                        for(let j = 0; j <= this.cols; j++) {
                            const inputElement = document.getElementById(`gj_A_${i}_${j}`);
                            if (inputElement) {
                                // MODIFICADO: Usar app.parseFraction
                                currentRow.push(app.parseFraction(inputElement.value)); 
                            } else {
                                console.error(`Input element gj_A_${i}_${j} not found!`);
                                currentRow.push(app.Fraction(0,1)); 
                            }
                        }
                        this.matrix.push(currentRow);
                    }
                    this.steps = [JSON.parse(JSON.stringify(this.matrix))]; 
                    this.history = [];
                    this.updateUI();
                },

                applyOperation() {
                    if (this.matrix.length === 0) {
                        alert("Primero genere o cargue una matriz.");
                        return;
                    }
                    const operationType = document.getElementById('gjOperationType').value;
                    const matrixBeforeOp = JSON.parse(JSON.stringify(this.matrix));
                    let opDescription = "";

                    try {
                        let row1_idx, row2_idx, scalar_val_str, scalar_val, target_idx, source_idx, multiplier_val_str, multiplier_val;

                        switch(operationType) {
                            case 'multiply':
                                row1_idx = parseInt(document.getElementById('gjOpRow1').value);
                                scalar_val_str = document.getElementById('gjOpScalar').value;
                                scalar_val = app.parseFraction(scalar_val_str); // MODIFICADO
                                if (isNaN(row1_idx)) throw new Error("Seleccione una fila.");
                                if (scalar_val.num === 0 && scalar_val.den === 1) {
                                     if (!confirm("Multiplicar una fila por cero resultará en una fila de ceros. ¿Continuar?")) return;
                                }
                                if (scalar_val.den === 0) throw new Error("Escalar no puede tener denominador cero.");

                                // MODIFICADO: usar app.multiplyFractions
                                this.matrix[row1_idx] = this.matrix[row1_idx].map(f => app.multiplyFractions(f, scalar_val));
                                opDescription = `F_{${row1_idx + 1}} \\leftarrow ${app.formatFractionForLatex(scalar_val)} \\cdot F_{${row1_idx + 1}}`;
                                break;
                                
                            case 'add':
                                target_idx = parseInt(document.getElementById('gjOpTargetRow').value);
                                source_idx = parseInt(document.getElementById('gjOpSourceRow').value);
                                multiplier_val_str = document.getElementById('gjOpMultiplier').value;
                                multiplier_val = app.parseFraction(multiplier_val_str); // MODIFICADO
                                if (isNaN(target_idx) || isNaN(source_idx)) throw new Error("Seleccione fila fuente y destino.");
                                if (target_idx === source_idx) throw new Error("Fila fuente y destino no pueden ser la misma para esta operación con k.");
                                if (multiplier_val.den === 0) throw new Error("Multiplicador no puede tener denominador cero.");
                                
                                // MODIFICADO: usar app.addFractions y app.multiplyFractions
                                this.matrix[target_idx] = this.matrix[target_idx].map((val, col_idx) => 
                                    app.addFractions(val, app.multiplyFractions(this.matrix[source_idx][col_idx], multiplier_val))
                                );
                                let k_formatted = app.formatFractionForLatex(multiplier_val);
                                if (multiplier_val.num < 0) k_formatted = `(${k_formatted})`;
                                opDescription = `F_{${target_idx + 1}} \\leftarrow F_{${target_idx + 1}} + ${k_formatted} \\cdot F_{${source_idx + 1}}`;
                                break;
                                
                            case 'swap':
                                row1_idx = parseInt(document.getElementById('gjOpRow1_swap').value);
                                row2_idx = parseInt(document.getElementById('gjOpRow2_swap').value);
                                if (isNaN(row1_idx) || isNaN(row2_idx)) throw new Error("Seleccione dos filas para intercambiar.");
                                if (row1_idx === row2_idx) throw new Error("Seleccione filas diferentes para intercambiar.");

                                [this.matrix[row1_idx], this.matrix[row2_idx]] = [this.matrix[row2_idx], this.matrix[row1_idx]];
                                opDescription = `F_{${row1_idx + 1}} \\leftrightarrow F_{${row2_idx + 1}}`;
                                break;
                        }
                        
                        this.steps.push(JSON.parse(JSON.stringify(this.matrix)));
                        this.history.push({ text: opDescription, matrixBefore: matrixBeforeOp, matrixAfter: JSON.parse(JSON.stringify(this.matrix)) });
                        this.updateUI();

                    } catch (e) {
                        alert("Error en la operación: " + e.message);
                    }
                },

                undoOperation() {
                    if (this.steps.length > 1) {
                        this.steps.pop();
                        this.matrix = JSON.parse(JSON.stringify(this.steps[this.steps.length - 1]));
                        this.history.pop();
                        this.updateUI();
                    } else {
                        alert("No hay operaciones para deshacer o está en el estado inicial.");
                    }
                },

                renderOperationParameterInputs() {
                    const container = document.getElementById('gjOperationInputs');
                    if (!container) return;
                    container.innerHTML = '';
                    const type = document.getElementById('gjOperationType').value;
                    let rowOptionsHTML = "";
                    for (let i = 0; i < this.rows; i++) {
                        rowOptionsHTML += `<option value="${i}">Fila ${i + 1}</option>`;
                    }
                    
                    if (type === 'multiply') {
                        container.innerHTML = `
                            <div class="mb-2">
                                <label for="gjOpRow1" class="form-label form-label-sm">Fila (Fᵢ):</label>
                                <select id="gjOpRow1" class="form-select form-select-sm">${rowOptionsHTML}</select>
                            </div>
                            <div class="mb-2">
                                <label for="gjOpScalar" class="form-label form-label-sm">Escalar (k, ej: 2, -1/3):</label>
                                <input type="text" id="gjOpScalar" class="form-control form-control-sm" value="1"> <!-- MODIFICADO: type="text" -->
                            </div>`;
                    } else if (type === 'add') {
                        container.innerHTML = `
                            <div class="mb-2">
                                <label for="gjOpTargetRow" class="form-label form-label-sm">Fila Destino (Fᵢ):</label>
                                <select id="gjOpTargetRow" class="form-select form-select-sm">${rowOptionsHTML}</select>
                            </div>
                            <div class="mb-2">
                                <label for="gjOpMultiplier" class="form-label form-label-sm">Multiplicador (k, ej: 1, 3/2):</label>
                                <input type="text" id="gjOpMultiplier" class="form-control form-control-sm" value="1"> <!-- MODIFICADO: type="text" -->
                            </div>
                            <div class="mb-2">
                                <label for="gjOpSourceRow" class="form-label form-label-sm">Fila Fuente (Fⱼ):</label>
                                <select id="gjOpSourceRow" class="form-select form-select-sm">${rowOptionsHTML}</select>
                            </div>`;
                    } else if (type === 'swap') {
                        container.innerHTML = `
                            <div class="mb-2">
                                <label for="gjOpRow1_swap" class="form-label form-label-sm">Fila 1 (Fᵢ):</label>
                                <select id="gjOpRow1_swap" class="form-select form-select-sm">${rowOptionsHTML}</select>
                            </div>
                            <div class="mb-2">
                                <label for="gjOpRow2_swap" class="form-label form-label-sm">Fila 2 (Fⱼ):</label>
                                <select id="gjOpRow2_swap" class="form-select form-select-sm">${rowOptionsHTML}</select>
                            </div>`;
                    }
                },
                
                matrixToLatex(matrixArray) { // MODIFICADO: Usa app.formatFractionForLatex
                    if (!matrixArray || matrixArray.length === 0) return '\\begin{pmatrix} \\text{No hay datos} \\end{pmatrix}';
                    if (!Array.isArray(matrixArray[0])) return '\\begin{pmatrix} \\text{Datos incorrectos} \\end{pmatrix}';

                    let latex = '\\left(\\begin{array}{';
                    // Generar columnas para matriz ampliada (separador antes de la última columna)
                    const cols = matrixArray[0].length;
                    latex += 'c'.repeat(cols - 1) + '|c';
                    latex += '}\n';
                    
                    matrixArray.forEach((row, rowIndex) => {
                        if (!Array.isArray(row)) {
                            latex += `\\text{Fila ${rowIndex+1} incorrecta}`;
                        } else {
                            latex += row.map(f_obj => app.formatFractionForLatex(f_obj)).join(' & ');
                        }
                        if (rowIndex < matrixArray.length - 1) {
                            latex += ' \\\\ \n';
                        }
                    });
                    return latex + '\n\\end{array}\\right)';
                },

                updateUI() {
                    const currentMatrixDiv = document.getElementById('gjCurrentMatrix');
                    const augmentedMatrixDiv = document.getElementById('gjAugmentedMatrix');
                    const historyDiv = document.getElementById('gjOperationHistory');
                    
                    if (currentMatrixDiv) {
                        currentMatrixDiv.innerHTML = (this.matrix && this.matrix.length > 0) 
                        ? `\\[ ${this.matrixToLatex(this.matrix)} \\]` 
                        : 'Aplique operaciones o genere una matriz.';
                    }
                    if (augmentedMatrixDiv) {
                        augmentedMatrixDiv.innerHTML = (this.steps && this.steps.length > 0 && this.steps[0]) 
                        ? `\\[ ${this.matrixToLatex(this.steps[0])} \\]` 
                        : 'Sistema no cargado.';
                    }
                    
                    if (historyDiv) {
                        historyDiv.innerHTML = this.history.length > 0 
                        ? this.history.map(h_entry => `<div>\\( ${h_entry.text} \\)</div>`).join('') 
                        : 'No hay operaciones realizadas.';
                    }
                    if (typeof MathJax !== "undefined" && MathJax.Hub) {
                        MathJax.Hub.Queue(["Typeset", MathJax.Hub, document.getElementById('tool-content')]);
                    }
                }
            } // End of app.gaussJordan
            
            ,circulo: {
                canvas: null,
                ctx: null,
                animationId: null,
                isAnimating: false,
                currentT: 0,
                
                init() {
                    this.canvas = document.getElementById('canvasCirculo');
                    if (!this.canvas) {
                        console.error('Canvas de círculo no encontrado');
                        return;
                    }
                    this.ctx = this.canvas.getContext('2d');
                    this.setupEventListeners();
                    this.updateAll();
                    this.dibujar();
                },
                
                setupEventListeners() {
                    const radioInput = document.getElementById('radioCirculo');
                    const centroHInput = document.getElementById('centroH');
                    const centroKInput = document.getElementById('centroK');
                    const parametroTInput = document.getElementById('parametroT');
                    
                    if (radioInput) radioInput.addEventListener('input', () => this.updateAll());
                    if (centroHInput) centroHInput.addEventListener('input', () => this.updateAll());
                    if (centroKInput) centroKInput.addEventListener('input', () => this.updateAll());
                    if (parametroTInput) {
                        parametroTInput.addEventListener('input', () => {
                            this.currentT = parseFloat(parametroTInput.value);
                            const valorTElement = document.getElementById('valorT');
                            if (valorTElement) valorTElement.textContent = this.currentT.toFixed(1);
                            this.updateAll();
                        });
                    }
                },
                
                updateAll() {
                    this.updateEcuaciones();
                    this.updatePropiedades();
                    this.updateInfoPunto();
                    this.dibujar();
                    
                    // Force MathJax reprocessing for circle
                    setTimeout(() => {
                        if (typeof MathJax !== "undefined" && MathJax.Hub) {
                            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
                        }
                    }, 100);
                },
                
                updateEcuaciones() {
                    const h = parseFloat(document.getElementById('centroH').value);
                    const k = parseFloat(document.getElementById('centroK').value);
                    const r = parseFloat(document.getElementById('radioCirculo').value);
                    
                    // Ecuación general del círculo
                    let ecuacionGeneral = '';
                    if (h === 0 && k === 0) {
                        ecuacionGeneral = `x^2 + y^2 = ${r}^2`;
                    } else {
                        const hStr = h === 0 ? '' : (h > 0 ? ` - ${h}` : ` + ${Math.abs(h)}`);
                        const kStr = k === 0 ? '' : (k > 0 ? ` - ${k}` : ` + ${Math.abs(k)}`);
                        ecuacionGeneral = `(x${hStr})^2 + (y${kStr})^2 = ${r}^2`;
                    }
                    
                    const ecuacionElement = document.getElementById('ecuacionCirculo');
                    if (ecuacionElement) {
                        ecuacionElement.innerHTML = `$$${ecuacionGeneral}$$`;
                    }
                    
                    // Coordenadas paramétricas
                    const hParam = h === 0 ? '' : (h > 0 ? ` + ${h}` : ` - ${Math.abs(h)}`);
                    const kParam = k === 0 ? '' : (k > 0 ? ` + ${k}` : ` - ${Math.abs(k)}`);
                    
                    // Construir las ecuaciones x e y por separado
                    const xEquation = `${r}\\cos(t)${hParam}`;
                    const yEquation = `${r}\\sin(t)${kParam}`;
                    
                    // Usar alternativa CSS Grid/SVG en lugar de LaTeX
                    const parametricasElement = document.getElementById('coordenadasParametricas');
                    if (parametricasElement) {
                        // Limpiar ecuaciones para la alternativa CSS
                        const cleanXEquation = xEquation.replace(/\\/g, '');
                        const cleanYEquation = yEquation.replace(/\\/g, '');
                        
                        // Usar alternativa SVG para mejores resultados visuales
                        const cssAlternative = app.formatParametricEquationsAlternative(cleanXEquation, cleanYEquation, 'svg');
                        parametricasElement.innerHTML = `<div class="parametric-equation-container">${cssAlternative}</div>`;
                        
                        console.log('Círculo: Usando alternativa CSS en lugar de LaTeX');
                    }
                    
                    // Forzar re-renderizado de MathJax usando función global
                    setTimeout(() => app.reprocessMathJaxGlobal([ecuacionElement, parametricasElement]), 200);
                },
                
                reprocessMathJax(elements) {
                    if (typeof MathJax !== "undefined") {
                        if (MathJax.Hub) {
                            // MathJax versión 2.x
                            elements.forEach(element => {
                                if (element) {
                                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
                                }
                            });
                        } else if (MathJax.typesetPromise) {
                            // MathJax versión 3.x
                            MathJax.typesetPromise(elements);
                        }
                    } else {
                        // Fallback: intentar después de un delay
                        setTimeout(() => {
                            if (typeof MathJax !== "undefined") {
                                if (MathJax.Hub) {
                                    elements.forEach(element => {
                                        if (element) {
                                            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
                                        }
                                    });
                                } else if (MathJax.typesetPromise) {
                                    MathJax.typesetPromise(elements);
                                }
                            }
                        }, 500);
                    }
                },
                
                updatePropiedades() {
                    const h = parseFloat(document.getElementById('centroH')?.value || 0);
                    const k = parseFloat(document.getElementById('centroK')?.value || 0);
                    const r = parseFloat(document.getElementById('radioCirculo')?.value || 5);
                    
                    const propRadioElement = document.getElementById('propRadio');
                    const propCentroHElement = document.getElementById('propCentroH');
                    const propCentroKElement = document.getElementById('propCentroK');
                    const propAreaElement = document.getElementById('propArea');
                    const propPerimetroElement = document.getElementById('propPerimetro');
                    
                    if (propRadioElement) propRadioElement.textContent = r;
                    if (propCentroHElement) propCentroHElement.textContent = h;
                    if (propCentroKElement) propCentroKElement.textContent = k;
                    if (propAreaElement) propAreaElement.textContent = (Math.PI * r * r).toFixed(2);
                    if (propPerimetroElement) propPerimetroElement.textContent = (2 * Math.PI * r).toFixed(2);
                },
                
                updateInfoPunto() {
                    const h = parseFloat(document.getElementById('centroH').value);
                    const k = parseFloat(document.getElementById('centroK').value);
                    const r = parseFloat(document.getElementById('radioCirculo').value);
                    const t = this.currentT;
                    
                    const x = r * Math.cos(t) + h;
                    const y = r * Math.sin(t) + k;
                    const distancia = Math.sqrt((x - h) * (x - h) + (y - k) * (y - k));
                    
                    document.getElementById('infoPunto').innerHTML = 
                        `Coordenadas: P(${x.toFixed(2)}, ${y.toFixed(2)})<br>` +
                        `Distancia al centro: ${distancia.toFixed(2)}`;
                },
                
                dibujar() {
                    const h = parseFloat(document.getElementById('centroH').value);
                    const k = parseFloat(document.getElementById('centroK').value);
                    const r = parseFloat(document.getElementById('radioCirculo').value);
                    const t = this.currentT;
                    
                    // Limpiar canvas
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Configurar sistema de coordenadas (centro del canvas)
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    const scale = 15; // píxeles por unidad
                    
                    // Dibujar grid
                    this.dibujarGrid(centerX, centerY, scale);
                    
                    // Dibujar ejes
                    this.dibujarEjes(centerX, centerY);
                    
                    // Transformar coordenadas matemáticas a canvas
                    const centroCanvasX = centerX + h * scale;
                    const centroCanvasY = centerY - k * scale;
                    const radioCanvas = r * scale;
                    
                    // Dibujar círculo
                    this.ctx.beginPath();
                    this.ctx.arc(centroCanvasX, centroCanvasY, radioCanvas, 0, 2 * Math.PI);
                    this.ctx.strokeStyle = '#007bff';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // Dibujar centro
                    this.ctx.beginPath();
                    this.ctx.arc(centroCanvasX, centroCanvasY, 4, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#dc3545';
                    this.ctx.fill();
                    
                    // Dibujar punto P(x,y)
                    const x = r * Math.cos(t) + h;
                    const y = r * Math.sin(t) + k;
                    const puntoX = centerX + x * scale;
                    const puntoY = centerY - y * scale;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(puntoX, puntoY, 5, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#28a745';
                    this.ctx.fill();
                    
                    // Dibujar línea desde centro hasta punto P
                    this.ctx.beginPath();
                    this.ctx.moveTo(centroCanvasX, centroCanvasY);
                    this.ctx.lineTo(puntoX, puntoY);
                    this.ctx.strokeStyle = '#ffc107';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    
                    // Etiquetas
                    this.ctx.font = '12px Arial';
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillText(`C(${h}, ${k})`, centroCanvasX + 8, centroCanvasY - 8);
                    this.ctx.fillText(`P(${x.toFixed(1)}, ${y.toFixed(1)})`, puntoX + 8, puntoY - 8);
                },
                
                dibujarGrid(centerX, centerY, scale) {
                    this.ctx.strokeStyle = '#e9ecef';
                    this.ctx.lineWidth = 0.5;
                    
                    // Líneas verticales
                    for (let i = -20; i <= 20; i++) {
                        const x = centerX + i * scale;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, 0);
                        this.ctx.lineTo(x, this.canvas.height);
                        this.ctx.stroke();
                    }
                    
                    // Líneas horizontales
                    for (let i = -15; i <= 15; i++) {
                        const y = centerY + i * scale;
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, y);
                        this.ctx.lineTo(this.canvas.width, y);
                        this.ctx.stroke();
                    }
                },
                
                dibujarEjes(centerX, centerY) {
                    this.ctx.strokeStyle = '#6c757d';
                    this.ctx.lineWidth = 1;
                    
                    // Eje X
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, centerY);
                    this.ctx.lineTo(this.canvas.width, centerY);
                    this.ctx.stroke();
                    
                    // Eje Y
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX, 0);
                    this.ctx.lineTo(centerX, this.canvas.height);
                    this.ctx.stroke();
                    
                    // Etiquetas de ejes
                    this.ctx.font = '12px Arial';
                    this.ctx.fillStyle = '#495057';
                    this.ctx.fillText('x', this.canvas.width - 20, centerY - 10);
                    this.ctx.fillText('y', centerX + 10, 15);
                    this.ctx.fillText('O', centerX + 5, centerY - 5);
                },
                
                animar() {
                    if (this.isAnimating) return;
                    
                    this.isAnimating = true;
                    const animate = () => {
                        if (!this.isAnimating) return;
                        
                        this.currentT += 0.05;
                        if (this.currentT > 2 * Math.PI) {
                            this.currentT = 0;
                        }
                        
                        document.getElementById('parametroT').value = this.currentT;
                        document.getElementById('valorT').textContent = this.currentT.toFixed(1);
                        
                        this.updateInfoPunto();
                        this.dibujar();
                        
                        this.animationId = requestAnimationFrame(animate);
                    };
                    
                    animate();
                },
                
                detenerAnimacion() {
                    this.isAnimating = false;
                    if (this.animationId) {
                        cancelAnimationFrame(this.animationId);
                        this.animationId = null;
                    }
                }
            } // End of app.circulo
            
            ,elipse: {
                canvas: null,
                ctx: null,
                animationId: null,
                isAnimating: false,
                currentT: 0,
                
                init() {
                    this.canvas = document.getElementById('canvasElipse');
                    if (!this.canvas) {
                        console.error('Canvas de elipse no encontrado');
                        return;
                    }
                    this.ctx = this.canvas.getContext('2d');
                    this.setupEventListeners();
                    this.updateAll();
                    this.dibujar();
                },
                
                setupEventListeners() {
                    const semiejeAInput = document.getElementById('semiejeA');
                    const semiiejeBInput = document.getElementById('semiejeB');
                    const centroHInput = document.getElementById('centroHElipse');
                    const centroKInput = document.getElementById('centroKElipse');
                    const parametroTInput = document.getElementById('parametroTElipse');
                    
                    if (semiejeAInput) semiejeAInput.addEventListener('input', () => this.updateAll());
                    if (semiiejeBInput) semiiejeBInput.addEventListener('input', () => this.updateAll());
                    if (centroHInput) centroHInput.addEventListener('input', () => this.updateAll());
                    if (centroKInput) centroKInput.addEventListener('input', () => this.updateAll());
                    if (parametroTInput) {
                        parametroTInput.addEventListener('input', () => {
                            this.currentT = parseFloat(parametroTInput.value);
                            const valorTElement = document.getElementById('valorTElipse');
                            if (valorTElement) valorTElement.textContent = this.currentT.toFixed(1);
                            this.updateAll();
                        });
                    }
                },
                
                updateAll() {
                    this.updateEcuaciones();
                    this.updatePropiedades();
                    this.updateInfoPunto();
                    this.dibujar();
                    
                    // Force MathJax reprocessing for ellipse
                    setTimeout(() => {
                        if (typeof MathJax !== "undefined" && MathJax.Hub) {
                            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
                        }
                    }, 100);
                },
                
                updateEcuaciones() {
                    const h = parseFloat(document.getElementById('centroHElipse')?.value || 0);
                    const k = parseFloat(document.getElementById('centroKElipse')?.value || 0);
                    const a = parseFloat(document.getElementById('semiejeA')?.value || 5);
                    const b = parseFloat(document.getElementById('semiejeB')?.value || 3);
                    
                    // Ecuación general de la elipse
                    let ecuacionGeneral = '';
                    if (h === 0 && k === 0) {
                        ecuacionGeneral = `\\frac{x^2}{${a}^2} + \\frac{y^2}{${b}^2} = 1`;
                    } else {
                        const hStr = h === 0 ? 'x' : (h > 0 ? `(x - ${h})` : `(x + ${Math.abs(h)})`);
                        const kStr = k === 0 ? 'y' : (k > 0 ? `(y - ${k})` : `(y + ${Math.abs(k)})`);
                        ecuacionGeneral = `\\frac{${hStr}^2}{${a}^2} + \\frac{${kStr}^2}{${b}^2} = 1`;
                    }
                    
                    const ecuacionElement = document.getElementById('ecuacionElipse');
                    if (ecuacionElement) {
                        ecuacionElement.innerHTML = `$$${ecuacionGeneral}$$`;
                    }
                    
                    // Coordenadas paramétricas
                    const hParam = h === 0 ? '' : (h > 0 ? ` + ${h}` : ` - ${Math.abs(h)}`);
                    const kParam = k === 0 ? '' : (k > 0 ? ` + ${k}` : ` - ${Math.abs(k)}`);
                    
                    // Construir las ecuaciones x e y por separado
                    const xEquation = `${a}\\cos(t)${hParam}`;
                    const yEquation = `${b}\\sin(t)${kParam}`;
                    
                    // Usar alternativa CSS Grid/SVG en lugar de LaTeX
                    const parametricasElement = document.getElementById('coordenadasParametricasElipse');
                    if (parametricasElement) {
                        // Limpiar ecuaciones para la alternativa CSS
                        const cleanXEquation = xEquation.replace(/\\/g, '');
                        const cleanYEquation = yEquation.replace(/\\/g, '');
                        
                        // Usar alternativa SVG para mejores resultados visuales
                        const cssAlternative = app.formatParametricEquationsAlternative(cleanXEquation, cleanYEquation, 'svg');
                        parametricasElement.innerHTML = `<div class="parametric-equation-container">${cssAlternative}</div>`;
                        
                        console.log('Elipse: Usando alternativa CSS en lugar de LaTeX');
                    }
                    
                    // Forzar re-renderizado de MathJax usando función global
                    setTimeout(() => app.reprocessMathJaxGlobal([ecuacionElement, parametricasElement]), 200);
                },
                
                reprocessMathJax(elements) {
                    if (typeof MathJax !== "undefined") {
                        if (MathJax.Hub) {
                            // MathJax versión 2.x
                            elements.forEach(element => {
                                if (element) {
                                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
                                }
                            });
                        } else if (MathJax.typesetPromise) {
                            // MathJax versión 3.x
                            MathJax.typesetPromise(elements);
                        }
                    } else {
                        // Fallback: intentar después de un delay
                        setTimeout(() => {
                            if (typeof MathJax !== "undefined") {
                                if (MathJax.Hub) {
                                    elements.forEach(element => {
                                        if (element) {
                                            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
                                        }
                                    });
                                } else if (MathJax.typesetPromise) {
                                    MathJax.typesetPromise(elements);
                                }
                            }
                        }, 500);
                    }
                },
                
                updatePropiedades() {
                    const h = parseFloat(document.getElementById('centroHElipse')?.value || 0);
                    const k = parseFloat(document.getElementById('centroKElipse')?.value || 0);
                    const a = parseFloat(document.getElementById('semiejeA')?.value || 5);
                    const b = parseFloat(document.getElementById('semiejeB')?.value || 3);
                    
                    // Asegurar que a >= b
                    const semiMayor = Math.max(a, b);
                    const semiMenor = Math.min(a, b);
                    
                    // Calcular distancia focal
                    const c = Math.sqrt(semiMayor * semiMayor - semiMenor * semiMenor);
                    const excentricidad = c / semiMayor;
                    const area = Math.PI * a * b;
                    
                    const propAElement = document.getElementById('propA');
                    const propBElement = document.getElementById('propB');
                    const propCentroHElement = document.getElementById('propCentroHElipse');
                    const propCentroKElement = document.getElementById('propCentroKElipse');
                    const propCElement = document.getElementById('propC');
                    const propExcentricidadElement = document.getElementById('propExcentricidad');
                    const propAreaElement = document.getElementById('propAreaElipse');
                    
                    if (propAElement) propAElement.textContent = a;
                    if (propBElement) propBElement.textContent = b;
                    if (propCentroHElement) propCentroHElement.textContent = h;
                    if (propCentroKElement) propCentroKElement.textContent = k;
                    if (propCElement) propCElement.textContent = c.toFixed(2);
                    if (propExcentricidadElement) propExcentricidadElement.textContent = excentricidad.toFixed(3);
                    if (propAreaElement) propAreaElement.textContent = area.toFixed(2);
                },
                
                updateInfoPunto() {
                    const h = parseFloat(document.getElementById('centroHElipse')?.value || 0);
                    const k = parseFloat(document.getElementById('centroKElipse')?.value || 0);
                    const a = parseFloat(document.getElementById('semiejeA')?.value || 5);
                    const b = parseFloat(document.getElementById('semiejeB')?.value || 3);
                    const t = this.currentT;
                    
                    const x = a * Math.cos(t) + h;
                    const y = b * Math.sin(t) + k;
                    
                    // Calcular distancia focal y focos
                    const semiMayor = Math.max(a, b);
                    const semiMenor = Math.min(a, b);
                    const c = Math.sqrt(semiMayor * semiMayor - semiMenor * semiMenor);
                    
                    let f1x, f1y, f2x, f2y;
                    if (a >= b) {
                        // Focos en el eje horizontal
                        f1x = h - c; f1y = k;
                        f2x = h + c; f2y = k;
                    } else {
                        // Focos en el eje vertical
                        f1x = h; f1y = k - c;
                        f2x = h; f2y = k + c;
                    }
                    
                    const dist1 = Math.sqrt((x - f1x) * (x - f1x) + (y - f1y) * (y - f1y));
                    const dist2 = Math.sqrt((x - f2x) * (x - f2x) + (y - f2y) * (y - f2y));
                    const sumaDistancias = dist1 + dist2;
                    
                    const infoPuntoElement = document.getElementById('infoPuntoElipse');
                    if (infoPuntoElement) {
                        infoPuntoElement.innerHTML = 
                            `Coordenadas: P(${x.toFixed(2)}, ${y.toFixed(2)})<br>` +
                            `Suma de distancias a focos: ${sumaDistancias.toFixed(2)}`;
                    }
                },
                
                dibujar() {
                    if (!this.canvas || !this.ctx) return;
                    
                    const h = parseFloat(document.getElementById('centroHElipse')?.value || 0);
                    const k = parseFloat(document.getElementById('centroKElipse')?.value || 0);
                    const a = parseFloat(document.getElementById('semiejeA')?.value || 5);
                    const b = parseFloat(document.getElementById('semiejeB')?.value || 3);
                    const t = this.currentT;
                    
                    // Limpiar canvas
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Configurar sistema de coordenadas
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    const scale = 15; // píxeles por unidad
                    
                    // Dibujar grid y ejes
                    this.dibujarGrid(centerX, centerY, scale);
                    this.dibujarEjes(centerX, centerY);
                    
                    // Transformar coordenadas matemáticas a canvas
                    const centroCanvasX = centerX + h * scale;
                    const centroCanvasY = centerY - k * scale;
                    
                    // Dibujar elipse
                    this.ctx.beginPath();
                    this.ctx.ellipse(centroCanvasX, centroCanvasY, a * scale, b * scale, 0, 0, 2 * Math.PI);
                    this.ctx.strokeStyle = '#007bff';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // Calcular y dibujar focos
                    const semiMayor = Math.max(a, b);
                    const semiMenor = Math.min(a, b);
                    const c = Math.sqrt(semiMayor * semiMayor - semiMenor * semiMenor);
                    
                    let f1x, f1y, f2x, f2y;
                    if (a >= b) {
                        f1x = h - c; f1y = k;
                        f2x = h + c; f2y = k;
                    } else {
                        f1x = h; f1y = k - c;
                        f2x = h; f2y = k + c;
                    }
                    
                    const f1CanvasX = centerX + f1x * scale;
                    const f1CanvasY = centerY - f1y * scale;
                    const f2CanvasX = centerX + f2x * scale;
                    const f2CanvasY = centerY - f2y * scale;
                    
                    // Dibujar focos
                    this.ctx.beginPath();
                    this.ctx.arc(f1CanvasX, f1CanvasY, 4, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#28a745';
                    this.ctx.fill();
                    
                    this.ctx.beginPath();
                    this.ctx.arc(f2CanvasX, f2CanvasY, 4, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#28a745';
                    this.ctx.fill();
                    
                    // Dibujar centro
                    this.ctx.beginPath();
                    this.ctx.arc(centroCanvasX, centroCanvasY, 4, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#dc3545';
                    this.ctx.fill();
                    
                    // Dibujar punto P(x,y)
                    const x = a * Math.cos(t) + h;
                    const y = b * Math.sin(t) + k;
                    const puntoX = centerX + x * scale;
                    const puntoY = centerY - y * scale;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(puntoX, puntoY, 5, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#ffc107';
                    this.ctx.fill();
                    
                    // Dibujar líneas desde focos hasta punto P
                    this.ctx.beginPath();
                    this.ctx.moveTo(f1CanvasX, f1CanvasY);
                    this.ctx.lineTo(puntoX, puntoY);
                    this.ctx.strokeStyle = '#20c997';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(f2CanvasX, f2CanvasY);
                    this.ctx.lineTo(puntoX, puntoY);
                    this.ctx.strokeStyle = '#20c997';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    
                    // Etiquetas
                    this.ctx.font = '12px Arial';
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillText(`C(${h}, ${k})`, centroCanvasX + 8, centroCanvasY - 8);
                    this.ctx.fillText(`F₁(${f1x.toFixed(1)}, ${f1y.toFixed(1)})`, f1CanvasX + 8, f1CanvasY - 8);
                    this.ctx.fillText(`F₂(${f2x.toFixed(1)}, ${f2y.toFixed(1)})`, f2CanvasX + 8, f2CanvasY - 8);
                    this.ctx.fillText(`P(${x.toFixed(1)}, ${y.toFixed(1)})`, puntoX + 8, puntoY - 8);
                },
                
                dibujarGrid(centerX, centerY, scale) {
                    this.ctx.strokeStyle = '#e9ecef';
                    this.ctx.lineWidth = 0.5;
                    
                    // Líneas verticales
                    for (let i = -20; i <= 20; i++) {
                        const x = centerX + i * scale;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, 0);
                        this.ctx.lineTo(x, this.canvas.height);
                        this.ctx.stroke();
                    }
                    
                    // Líneas horizontales
                    for (let i = -15; i <= 15; i++) {
                        const y = centerY + i * scale;
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, y);
                        this.ctx.lineTo(this.canvas.width, y);
                        this.ctx.stroke();
                    }
                },
                
                dibujarEjes(centerX, centerY) {
                    this.ctx.strokeStyle = '#6c757d';
                    this.ctx.lineWidth = 1;
                    
                    // Eje X
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, centerY);
                    this.ctx.lineTo(this.canvas.width, centerY);
                    this.ctx.stroke();
                    
                    // Eje Y
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX, 0);
                    this.ctx.lineTo(centerX, this.canvas.height);
                    this.ctx.stroke();
                    
                    // Etiquetas de ejes
                    this.ctx.font = '12px Arial';
                    this.ctx.fillStyle = '#495057';
                    this.ctx.fillText('x', this.canvas.width - 20, centerY - 10);
                    this.ctx.fillText('y', centerX + 10, 15);
                    this.ctx.fillText('O', centerX + 5, centerY - 5);
                },
                
                animar() {
                    if (this.isAnimating) return;
                    
                    this.isAnimating = true;
                    const animate = () => {
                        if (!this.isAnimating) return;
                        
                        this.currentT += 0.05;
                        if (this.currentT > 2 * Math.PI) {
                            this.currentT = 0;
                        }
                        
                        const parametroTElement = document.getElementById('parametroTElipse');
                        const valorTElement = document.getElementById('valorTElipse');
                        
                        if (parametroTElement) parametroTElement.value = this.currentT;
                        if (valorTElement) valorTElement.textContent = this.currentT.toFixed(1);
                        
                        this.updateInfoPunto();
                        this.dibujar();
                        
                        this.animationId = requestAnimationFrame(animate);
                    };
                    
                    animate();
                },
                
                detenerAnimacion() {
                    this.isAnimating = false;
                    if (this.animationId) {
                        cancelAnimationFrame(this.animationId);
                        this.animationId = null;
                    }
                }
            } // End of app.elipse
            
            ,hiperbola: {
                canvas: null,
                ctx: null,
                animationId: null,
                isAnimating: false,
                currentT: 1,
                
                init() {
                    this.canvas = document.getElementById('canvasHiperbola');
                    if (!this.canvas) {
                        console.error('Canvas de hipérbola no encontrado');
                        return;
                    }
                    this.ctx = this.canvas.getContext('2d');
                    this.setupEventListeners();
                    this.updateAll();
                    this.dibujar();
                },
                
                setupEventListeners() {
                    const semiejeAInput = document.getElementById('semiejeAHip');
                    const semiiejeBInput = document.getElementById('semiiejeBHip');
                    const centroHInput = document.getElementById('centroHHiperbola');
                    const centroKInput = document.getElementById('centroKHiperbola');
                    const parametroTInput = document.getElementById('parametroTHiperbola');
                    
                    if (semiejeAInput) semiejeAInput.addEventListener('input', () => this.updateAll());
                    if (semiiejeBInput) semiiejeBInput.addEventListener('input', () => this.updateAll());
                    if (centroHInput) centroHInput.addEventListener('input', () => this.updateAll());
                    if (centroKInput) centroKInput.addEventListener('input', () => this.updateAll());
                    if (parametroTInput) {
                        parametroTInput.addEventListener('input', () => {
                            this.currentT = parseFloat(parametroTInput.value);
                            const valorTElement = document.getElementById('valorTHiperbola');
                            if (valorTElement) valorTElement.textContent = this.currentT.toFixed(1);
                            this.updateAll();
                        });
                    }
                },
                
                updateAll() {
                    this.updateEcuaciones();
                    this.updatePropiedades();
                    this.updateInfoPunto();
                    this.dibujar();
                    
                    // Force MathJax reprocessing for hyperbola
                    setTimeout(() => {
                        if (typeof MathJax !== "undefined" && MathJax.Hub) {
                            MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
                        }
                    }, 100);
                },
                
                updateEcuaciones() {
                    const h = parseFloat(document.getElementById('centroHHiperbola')?.value || 0);
                    const k = parseFloat(document.getElementById('centroKHiperbola')?.value || 0);
                    const a = parseFloat(document.getElementById('semiejeAHip')?.value || 3);
                    const b = parseFloat(document.getElementById('semiiejeBHip')?.value || 4);
                    
                    // Ecuación general de la hipérbola
                    let ecuacionGeneral = '';
                    if (h === 0 && k === 0) {
                        ecuacionGeneral = `\\frac{x^2}{${a}^2} - \\frac{y^2}{${b}^2} = 1`;
                    } else {
                        const hStr = h === 0 ? 'x' : (h > 0 ? `(x - ${h})` : `(x + ${Math.abs(h)})`);
                        const kStr = k === 0 ? 'y' : (k > 0 ? `(y - ${k})` : `(y + ${Math.abs(k)})`);
                        ecuacionGeneral = `\\frac{${hStr}^2}{${a}^2} - \\frac{${kStr}^2}{${b}^2} = 1`;
                    }
                    
                    const ecuacionElement = document.getElementById('ecuacionHiperbola');
                    if (ecuacionElement) {
                        ecuacionElement.innerHTML = `$$${ecuacionGeneral}$$`;
                    }
                    
                    // Coordenadas paramétricas
                    const hParam = h === 0 ? '' : (h > 0 ? ` + ${h}` : ` - ${Math.abs(h)}`);
                    const kParam = k === 0 ? '' : (k > 0 ? ` + ${k}` : ` - ${Math.abs(k)}`);
                    
                    // Construir las ecuaciones x e y por separado
                    const xEquation = `${a}\\cosh(t)${hParam}`;
                    const yEquation = `${b}\\sinh(t)${kParam}`;
                    
                    // Usar alternativa CSS Grid/SVG en lugar de LaTeX
                    const parametricasElement = document.getElementById('coordenadasParametricasHiperbola');
                    if (parametricasElement) {
                        // Limpiar ecuaciones para la alternativa CSS
                        const cleanXEquation = xEquation.replace(/\\/g, '');
                        const cleanYEquation = yEquation.replace(/\\/g, '');
                        
                        // Usar alternativa SVG para mejores resultados visuales
                        const cssAlternative = app.formatParametricEquationsAlternative(cleanXEquation, cleanYEquation, 'svg');
                        parametricasElement.innerHTML = `<div class="parametric-equation-container">${cssAlternative}</div>`;
                        
                        console.log('Hipérbola: Usando alternativa CSS en lugar de LaTeX');
                    }
                    
                    // Forzar re-renderizado de MathJax usando función global
                    setTimeout(() => app.reprocessMathJaxGlobal([ecuacionElement, parametricasElement]), 200);
                },
                
                reprocessMathJax(elements) {
                    if (typeof MathJax !== "undefined") {
                        if (MathJax.Hub) {
                            // MathJax versión 2.x
                            elements.forEach(element => {
                                if (element) {
                                    MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
                                }
                            });
                        } else if (MathJax.typesetPromise) {
                            // MathJax versión 3.x
                            MathJax.typesetPromise(elements);
                        }
                    } else {
                        // Fallback: intentar después de un delay
                        setTimeout(() => {
                            if (typeof MathJax !== "undefined") {
                                if (MathJax.Hub) {
                                    elements.forEach(element => {
                                        if (element) {
                                            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
                                        }
                                    });
                                } else if (MathJax.typesetPromise) {
                                    MathJax.typesetPromise(elements);
                                }
                            }
                        }, 500);
                    }
                },
                
                updatePropiedades() {
                    const h = parseFloat(document.getElementById('centroHHiperbola')?.value || 0);
                    const k = parseFloat(document.getElementById('centroKHiperbola')?.value || 0);
                    const a = parseFloat(document.getElementById('semiejeAHip')?.value || 3);
                    const b = parseFloat(document.getElementById('semiiejeBHip')?.value || 4);
                    
                    // Calcular distancia focal
                    const c = Math.sqrt(a * a + b * b);
                    const excentricidad = c / a;
                    const pendienteAsintotas = b / a;
                    
                    const propAElement = document.getElementById('propAHip');
                    const propBElement = document.getElementById('propBHip');
                    const propCentroHElement = document.getElementById('propCentroHHiperbola');
                    const propCentroKElement = document.getElementById('propCentroKHiperbola');
                    const propCElement = document.getElementById('propCHip');
                    const propExcentricidadElement = document.getElementById('propExcentricidadHip');
                    const propAsintotasElement = document.getElementById('propAsintotasHip');
                    
                    if (propAElement) propAElement.textContent = a;
                    if (propBElement) propBElement.textContent = b;
                    if (propCentroHElement) propCentroHElement.textContent = h;
                    if (propCentroKElement) propCentroKElement.textContent = k;
                    if (propCElement) propCElement.textContent = c.toFixed(2);
                    if (propExcentricidadElement) propExcentricidadElement.textContent = excentricidad.toFixed(3);
                    if (propAsintotasElement) propAsintotasElement.textContent = pendienteAsintotas.toFixed(3);
                },
                
                updateInfoPunto() {
                    const h = parseFloat(document.getElementById('centroHHiperbola')?.value || 0);
                    const k = parseFloat(document.getElementById('centroKHiperbola')?.value || 0);
                    const a = parseFloat(document.getElementById('semiejeAHip')?.value || 3);
                    const b = parseFloat(document.getElementById('semiiejeBHip')?.value || 4);
                    const t = this.currentT;
                    
                    // Para hipérbola, usamos función cosh y sinh (hiperbólicas)
                    const x = a * Math.cosh(t) + h;
                    const y = b * Math.sinh(t) + k;
                    
                    // Calcular distancia focal y focos
                    const c = Math.sqrt(a * a + b * b);
                    
                    // Focos siempre en el eje horizontal para esta implementación
                    const f1x = h - c; 
                    const f1y = k;
                    const f2x = h + c; 
                    const f2y = k;
                    
                    const dist1 = Math.sqrt((x - f1x) * (x - f1x) + (y - f1y) * (y - f1y));
                    const dist2 = Math.sqrt((x - f2x) * (x - f2x) + (y - f2y) * (y - f2y));
                    const diferenciaDistancias = Math.abs(dist1 - dist2);
                    
                    const infoPuntoElement = document.getElementById('infoPuntoHiperbola');
                    if (infoPuntoElement) {
                        infoPuntoElement.innerHTML = 
                            `Coordenadas: P(${x.toFixed(2)}, ${y.toFixed(2)})<br>` +
                            `Diferencia de distancias a focos: ${diferenciaDistancias.toFixed(2)}`;
                    }
                },
                
                dibujar() {
                    if (!this.canvas || !this.ctx) return;
                    
                    const h = parseFloat(document.getElementById('centroHHiperbola')?.value || 0);
                    const k = parseFloat(document.getElementById('centroKHiperbola')?.value || 0);
                    const a = parseFloat(document.getElementById('semiejeAHip')?.value || 3);
                    const b = parseFloat(document.getElementById('semiiejeBHip')?.value || 4);
                    const t = this.currentT;
                    
                    // Limpiar canvas
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Configurar sistema de coordenadas
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    const scale = 20; // píxeles por unidad
                    
                    // Dibujar grid y ejes
                    this.dibujarGrid(centerX, centerY, scale);
                    this.dibujarEjes(centerX, centerY);
                    
                    // Transformar coordenadas matemáticas a canvas
                    const centroCanvasX = centerX + h * scale;
                    const centroCanvasY = centerY - k * scale;
                    
                    // Dibujar hipérbola (usando funciones hiperbólicas)
                    this.ctx.strokeStyle = '#007bff';
                    this.ctx.lineWidth = 2;
                    
                    // Rama derecha
                    this.ctx.beginPath();
                    for (let tVal = -2; tVal <= 2; tVal += 0.05) {
                        const x = a * Math.cosh(tVal) + h;
                        const y = b * Math.sinh(tVal) + k;
                        const canvasX = centerX + x * scale;
                        const canvasY = centerY - y * scale;
                        
                        if (tVal === -2) {
                            this.ctx.moveTo(canvasX, canvasY);
                        } else {
                            this.ctx.lineTo(canvasX, canvasY);
                        }
                    }
                    this.ctx.stroke();
                    
                    // Rama izquierda
                    this.ctx.beginPath();
                    for (let tVal = -2; tVal <= 2; tVal += 0.05) {
                        const x = -a * Math.cosh(tVal) + h;
                        const y = b * Math.sinh(tVal) + k;
                        const canvasX = centerX + x * scale;
                        const canvasY = centerY - y * scale;
                        
                        if (tVal === -2) {
                            this.ctx.moveTo(canvasX, canvasY);
                        } else {
                            this.ctx.lineTo(canvasX, canvasY);
                        }
                    }
                    this.ctx.stroke();
                    
                    // Dibujar asíntotas
                    this.ctx.strokeStyle = '#dc3545';
                    this.ctx.lineWidth = 1;
                    this.ctx.setLineDash([5, 5]);
                    
                    const pendiente = b / a;
                    const xRange = 15;
                    
                    // Asíntota positiva
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX + (-xRange + h) * scale, centerY - (-pendiente * xRange + k) * scale);
                    this.ctx.lineTo(centerX + (xRange + h) * scale, centerY - (pendiente * xRange + k) * scale);
                    this.ctx.stroke();
                    
                    // Asíntota negativa
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX + (-xRange + h) * scale, centerY - (pendiente * xRange + k) * scale);
                    this.ctx.lineTo(centerX + (xRange + h) * scale, centerY - (-pendiente * xRange + k) * scale);
                    this.ctx.stroke();
                    
                    this.ctx.setLineDash([]); // Resetear línea punteada
                    
                    // Calcular y dibujar focos
                    const c = Math.sqrt(a * a + b * b);
                    const f1x = h - c; 
                    const f1y = k;
                    const f2x = h + c; 
                    const f2y = k;
                    
                    const f1CanvasX = centerX + f1x * scale;
                    const f1CanvasY = centerY - f1y * scale;
                    const f2CanvasX = centerX + f2x * scale;
                    const f2CanvasY = centerY - f2y * scale;
                    
                    // Dibujar focos
                    this.ctx.beginPath();
                    this.ctx.arc(f1CanvasX, f1CanvasY, 4, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#28a745';
                    this.ctx.fill();
                    
                    this.ctx.beginPath();
                    this.ctx.arc(f2CanvasX, f2CanvasY, 4, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#28a745';
                    this.ctx.fill();
                    
                    // Dibujar centro
                    this.ctx.beginPath();
                    this.ctx.arc(centroCanvasX, centroCanvasY, 4, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#dc3545';
                    this.ctx.fill();
                    
                    // Dibujar punto P(x,y)
                    const x = a * Math.cosh(t) + h;
                    const y = b * Math.sinh(t) + k;
                    const puntoX = centerX + x * scale;
                    const puntoY = centerY - y * scale;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(puntoX, puntoY, 5, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#ffc107';
                    this.ctx.fill();
                    
                    // Dibujar líneas desde focos hasta punto P
                    this.ctx.strokeStyle = '#20c997';
                    this.ctx.lineWidth = 1;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(f1CanvasX, f1CanvasY);
                    this.ctx.lineTo(puntoX, puntoY);
                    this.ctx.stroke();
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(f2CanvasX, f2CanvasY);
                    this.ctx.lineTo(puntoX, puntoY);
                    this.ctx.stroke();
                    
                    // Etiquetas
                    this.ctx.font = '12px Arial';
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillText(`C(${h}, ${k})`, centroCanvasX + 8, centroCanvasY - 8);
                    this.ctx.fillText(`F₁(${f1x.toFixed(1)}, ${f1y.toFixed(1)})`, f1CanvasX + 8, f1CanvasY - 8);
                    this.ctx.fillText(`F₂(${f2x.toFixed(1)}, ${f2y.toFixed(1)})`, f2CanvasX + 8, f2CanvasY - 8);
                    this.ctx.fillText(`P(${x.toFixed(1)}, ${y.toFixed(1)})`, puntoX + 8, puntoY - 8);
                },
                
                dibujarGrid(centerX, centerY, scale) {
                    this.ctx.strokeStyle = '#e9ecef';
                    this.ctx.lineWidth = 0.5;
                    
                    // Líneas verticales
                    for (let i = -15; i <= 15; i++) {
                        const x = centerX + i * scale;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, 0);
                        this.ctx.lineTo(x, this.canvas.height);
                        this.ctx.stroke();
                    }
                    
                    // Líneas horizontales
                    for (let i = -10; i <= 10; i++) {
                        const y = centerY + i * scale;
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, y);
                        this.ctx.lineTo(this.canvas.width, y);
                        this.ctx.stroke();
                    }
                },
                
                dibujarEjes(centerX, centerY) {
                    this.ctx.strokeStyle = '#6c757d';
                    this.ctx.lineWidth = 1;
                    
                    // Eje X
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, centerY);
                    this.ctx.lineTo(this.canvas.width, centerY);
                    this.ctx.stroke();
                    
                    // Eje Y
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX, 0);
                    this.ctx.lineTo(centerX, this.canvas.height);
                    this.ctx.stroke();
                    
                    // Etiquetas de ejes
                    this.ctx.font = '12px Arial';
                    this.ctx.fillStyle = '#495057';
                    this.ctx.fillText('x', this.canvas.width - 20, centerY - 10);
                    this.ctx.fillText('y', centerX + 10, 15);
                    this.ctx.fillText('O', centerX + 5, centerY - 5);
                },
                
                animar() {
                    if (this.isAnimating) return;
                    
                    this.isAnimating = true;
                    const animate = () => {
                        if (!this.isAnimating) return;
                        
                        this.currentT += 0.05;
                        if (this.currentT > 3) {
                            this.currentT = -3;
                        }
                        
                        const parametroTElement = document.getElementById('parametroTHiperbola');
                        const valorTElement = document.getElementById('valorTHiperbola');
                        
                        if (parametroTElement) parametroTElement.value = this.currentT;
                        if (valorTElement) valorTElement.textContent = this.currentT.toFixed(1);
                        
                        this.updateInfoPunto();
                        this.dibujar();
                        
                        this.animationId = requestAnimationFrame(animate);
                    };
                    
                    animate();
                },
                
                detenerAnimacion() {
                    this.isAnimating = false;
                    if (this.animationId) {
                        cancelAnimationFrame(this.animationId);
                        this.animationId = null;
                    }
                }
            } // End of app.hiperbola
            
            ,parabolaVertical: {
                canvas: null,
                ctx: null,
                animationId: null,
                isAnimating: false,
                currentX: 0,
                
                init() {
                    this.canvas = document.getElementById('canvasParabolaVertical');
                    if (!this.canvas) {
                        console.error('Canvas de parábola vertical no encontrado');
                        return;
                    }
                    this.ctx = this.canvas.getContext('2d');
                    
                    // Inicializar valor por defecto del input
                    const valorXInput = document.getElementById('valorXParV');
                    if (valorXInput) {
                        this.currentX = parseFloat(valorXInput.value) || 0;
                    }
                    
                    this.setupEventListeners();
                    this.updateAll();
                    this.dibujar();
                },
                
                setupEventListeners() {
                    const coefAInput = document.getElementById('coefAParV');
                    const coefBInput = document.getElementById('coefBParV');
                    const coefCInput = document.getElementById('coefCParV');
                    const valorXInput = document.getElementById('valorXParV');
                    
                    if (coefAInput) coefAInput.addEventListener('input', () => this.updateAll());
                    if (coefBInput) coefBInput.addEventListener('input', () => this.updateAll());
                    if (coefCInput) coefCInput.addEventListener('input', () => this.updateAll());
                    if (valorXInput) {
                        valorXInput.addEventListener('input', () => {
                            this.currentX = parseFloat(valorXInput.value);
                            this.updateAll();
                        });
                    }
                },
                
                updateAll() {
                    // Verificar que A no sea cero para que sea una parábola válida
                    const AElement = document.getElementById('coefAParV');
                    if (AElement) {
                        let A = parseFloat(AElement.value);
                        if (A === 0) {
                            A = 0.1;
                            AElement.value = A;
                        }
                    }
                    
                    this.updateEcuaciones();
                    this.updatePropiedades();
                    this.updateInfoPunto();
                    this.updateEvaluacion();
                    this.dibujar();
                    
                    // Force MathJax reprocessing
                    setTimeout(() => {
                        if (typeof MathJax !== "undefined") {
                            if (MathJax.Hub) {
                                MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
                            } else if (MathJax.typesetPromise) {
                                MathJax.typesetPromise();
                            }
                        }
                    }, 100);
                },
                
                updateEcuaciones() {
                    const A = parseFloat(document.getElementById('coefAParV')?.value || 1);
                    const B = parseFloat(document.getElementById('coefBParV')?.value || 0);
                    const C = parseFloat(document.getElementById('coefCParV')?.value || -1);
                    
                    let ecuacion = `y = `;
                    let terminos = [];
                    
                    // Término cuadrático
                    if (A !== 0) {
                        if (A === 1) {
                            terminos.push('x^2');
                        } else if (A === -1) {
                            terminos.push('-x^2');
                        } else {
                            terminos.push(`${A}x^2`);
                        }
                    }
                    
                    // Término lineal
                    if (B !== 0) {
                        if (B === 1) {
                            terminos.push(terminos.length > 0 ? '+x' : 'x');
                        } else if (B === -1) {
                            terminos.push('-x');
                        } else if (B > 0) {
                            terminos.push(terminos.length > 0 ? `+${B}x` : `${B}x`);
                        } else {
                            terminos.push(`${B}x`);
                        }
                    }
                    
                    // Término constante
                    if (C !== 0) {
                        if (C > 0) {
                            terminos.push(terminos.length > 0 ? `+${C}` : `${C}`);
                        } else {
                            terminos.push(`${C}`);
                        }
                    }
                    
                    // Si no hay términos, mostrar 0
                    if (terminos.length === 0) {
                        ecuacion += '0';
                    } else {
                        ecuacion += terminos.join('');
                    }
                    
                    const ecuacionElement = document.getElementById('ecuacionParabolaVertical');
                    if (ecuacionElement) {
                        ecuacionElement.innerHTML = `$$${ecuacion}$$`;
                    }
                },
                
                updatePropiedades() {
                    const A = parseFloat(document.getElementById('coefAParV')?.value || 1);
                    const B = parseFloat(document.getElementById('coefBParV')?.value || 0);
                    const C = parseFloat(document.getElementById('coefCParV')?.value || -1);
                    
                    // Calcular vértice
                    const h = -B / (2 * A);
                    const k = C - (B * B) / (4 * A);
                    
                    // Calcular parámetro p
                    const p = 1 / (4 * A);
                    
                    // Calcular foco
                    const focoH = h;
                    const focoK = k + p;
                    
                    // Directriz
                    const directriz = k - p;
                    
                    // Concavidad
                    const concavidad = A > 0 ? "Hacia arriba" : "Hacia abajo";
                    
                    // Raíces
                    const discriminant = B * B - 4 * A * C;
                    let raicesText = "";
                    if (discriminant > 0) {
                        const x1 = (-B + Math.sqrt(discriminant)) / (2 * A);
                        const x2 = (-B - Math.sqrt(discriminant)) / (2 * A);
                        raicesText = `Raíces: x₁ = ${x1.toFixed(3)}, x₂ = ${x2.toFixed(3)}`;
                    } else if (discriminant === 0) {
                        const x = -B / (2 * A);
                        raicesText = `Raíz única: x = ${x.toFixed(3)}`;
                    } else {
                        raicesText = "No tiene raíces reales";
                    }
                    
                    // Actualizar elementos DOM
                    const propVerticeHElement = document.getElementById('propVerticeHParV');
                    const propVerticeKElement = document.getElementById('propVerticeKParV');
                    const propFocoHElement = document.getElementById('propFocoHParV');
                    const propFocoKElement = document.getElementById('propFocoKParV');
                    const propPElement = document.getElementById('propPParV');
                    const propDirectrizElement = document.getElementById('propDirectrizParV');
                    const propConcavidadElement = document.getElementById('propConcavidadParV');
                    const propRaicesElement = document.getElementById('propRaicesParV');
                    
                    if (propVerticeHElement) propVerticeHElement.textContent = h.toFixed(3);
                    if (propVerticeKElement) propVerticeKElement.textContent = k.toFixed(3);
                    if (propFocoHElement) propFocoHElement.textContent = focoH.toFixed(3);
                    if (propFocoKElement) propFocoKElement.textContent = focoK.toFixed(3);
                    if (propPElement) propPElement.textContent = Math.abs(p).toFixed(3);
                    if (propDirectrizElement) propDirectrizElement.textContent = directriz.toFixed(3);
                    if (propConcavidadElement) propConcavidadElement.textContent = concavidad;
                    if (propRaicesElement) propRaicesElement.textContent = raicesText;
                },
                
                updateEvaluacion() {
                    const A = parseFloat(document.getElementById('coefAParV')?.value || 1);
                    const B = parseFloat(document.getElementById('coefBParV')?.value || 0);
                    const C = parseFloat(document.getElementById('coefCParV')?.value || -1);
                    const x = this.currentX;
                    
                    const y = A * x * x + B * x + C;
                    
                    const valorXMostrarElement = document.getElementById('valorXMostrarParV');
                    const resultadoEvalElement = document.getElementById('resultadoEvalParV');
                    
                    if (valorXMostrarElement) valorXMostrarElement.textContent = x.toFixed(1);
                    if (resultadoEvalElement) resultadoEvalElement.textContent = y.toFixed(3);
                },
                
                updateInfoPunto() {
                    const A = parseFloat(document.getElementById('coefAParV')?.value || 1);
                    const B = parseFloat(document.getElementById('coefBParV')?.value || 0);
                    const C = parseFloat(document.getElementById('coefCParV')?.value || -1);
                    const x = this.currentX;
                    const y = A * x * x + B * x + C;
                    
                    // Calcular vértice y foco
                    const h = -B / (2 * A);
                    const k = C - (B * B) / (4 * A);
                    const p = 1 / (4 * A);
                    const focoH = h;
                    const focoK = k + p;
                    const directriz = k - p;
                    
                    // Calcular distancias
                    const distFoco = Math.sqrt((x - focoH) * (x - focoH) + (y - focoK) * (y - focoK));
                    const distDirectriz = Math.abs(y - directriz);
                    
                    const infoPuntoElement = document.getElementById('infoPuntoParV');
                    if (infoPuntoElement) {
                        infoPuntoElement.innerHTML = 
                            `Coordenadas: P(${x.toFixed(2)}, ${y.toFixed(2)})<br>` +
                            `Distancia al foco: ${distFoco.toFixed(3)}<br>` +
                            `Distancia a directriz: ${distDirectriz.toFixed(3)}`;
                    }
                },
                
                dibujar() {
                    if (!this.canvas || !this.ctx) return;
                    
                    const A = parseFloat(document.getElementById('coefAParV')?.value || 1);
                    const B = parseFloat(document.getElementById('coefBParV')?.value || 0);
                    const C = parseFloat(document.getElementById('coefCParV')?.value || -1);
                    
                    // Limpiar canvas
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Configurar sistema de coordenadas
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    const scale = 30; // píxeles por unidad
                    
                    // Dibujar grid y ejes
                    this.dibujarGrid(centerX, centerY, scale);
                    this.dibujarEjes(centerX, centerY);
                    
                    // Dibujar parábola
                    this.ctx.strokeStyle = '#fd7e14';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    
                    let first = true;
                    const rangeX = 10;
                    const step = 0.05;
                    
                    for (let x = -rangeX; x <= rangeX; x += step) {
                        const y = A * x * x + B * x + C;
                        const canvasX = centerX + x * scale;
                        const canvasY = centerY - y * scale;
                        
                        // Verificar si el punto está dentro del canvas con un margen
                        if (canvasX >= -50 && canvasX <= this.canvas.width + 50 && 
                            canvasY >= -50 && canvasY <= this.canvas.height + 50) {
                            if (first) {
                                this.ctx.moveTo(canvasX, canvasY);
                                first = false;
                            } else {
                                this.ctx.lineTo(canvasX, canvasY);
                            }
                        } else if (!first) {
                            // Si salimos del área visible, terminamos la línea actual
                            this.ctx.stroke();
                            first = true;
                        }
                    }
                    if (!first) {
                        this.ctx.stroke();
                    }
                    
                    // Calcular y dibujar elementos
                    const h = -B / (2 * A);
                    const k = C - (B * B) / (4 * A);
                    const p = 1 / (4 * A);
                    const focoH = h;
                    const focoK = k + p;
                    const directriz = k - p;
                    
                    // Dibujar vértice
                    const verticeCanvasX = centerX + h * scale;
                    const verticeCanvasY = centerY - k * scale;
                    this.ctx.beginPath();
                    this.ctx.arc(verticeCanvasX, verticeCanvasY, 6, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#dc3545';
                    this.ctx.fill();
                    
                    // Dibujar foco
                    const focoCanvasX = centerX + focoH * scale;
                    const focoCanvasY = centerY - focoK * scale;
                    this.ctx.beginPath();
                    this.ctx.arc(focoCanvasX, focoCanvasY, 5, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#28a745';
                    this.ctx.fill();
                    
                    // Dibujar directriz
                    const directrizCanvasY = centerY - directriz * scale;
                    this.ctx.strokeStyle = '#6f42c1';
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, directrizCanvasY);
                    this.ctx.lineTo(this.canvas.width, directrizCanvasY);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                    
                    // Dibujar punto actual
                    const x = this.currentX;
                    const y = A * x * x + B * x + C;
                    const puntoCanvasX = centerX + x * scale;
                    const puntoCanvasY = centerY - y * scale;
                    this.ctx.beginPath();
                    this.ctx.arc(puntoCanvasX, puntoCanvasY, 5, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#ffc107';
                    this.ctx.fill();
                    
                    // Líneas desde punto al foco y a la directriz
                    this.ctx.strokeStyle = '#20c997';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(puntoCanvasX, puntoCanvasY);
                    this.ctx.lineTo(focoCanvasX, focoCanvasY);
                    this.ctx.stroke();
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(puntoCanvasX, puntoCanvasY);
                    this.ctx.lineTo(puntoCanvasX, directrizCanvasY);
                    this.ctx.stroke();
                    
                    // Etiquetas
                    this.ctx.font = '12px Arial';
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillText(`V(${h.toFixed(1)}, ${k.toFixed(1)})`, verticeCanvasX + 8, verticeCanvasY - 8);
                    this.ctx.fillText(`F(${focoH.toFixed(1)}, ${focoK.toFixed(1)})`, focoCanvasX + 8, focoCanvasY - 8);
                    this.ctx.fillText(`P(${x.toFixed(1)}, ${y.toFixed(1)})`, puntoCanvasX + 8, puntoCanvasY - 8);
                },
                
                dibujarGrid(centerX, centerY, scale) {
                    this.ctx.strokeStyle = '#e9ecef';
                    this.ctx.lineWidth = 0.5;
                    
                    // Líneas verticales
                    for (let i = -10; i <= 10; i++) {
                        const x = centerX + i * scale;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, 0);
                        this.ctx.lineTo(x, this.canvas.height);
                        this.ctx.stroke();
                    }
                    
                    // Líneas horizontales
                    for (let i = -7; i <= 7; i++) {
                        const y = centerY + i * scale;
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, y);
                        this.ctx.lineTo(this.canvas.width, y);
                        this.ctx.stroke();
                    }
                },
                
                dibujarEjes(centerX, centerY) {
                    this.ctx.strokeStyle = '#6c757d';
                    this.ctx.lineWidth = 1;
                    
                    // Eje X
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, centerY);
                    this.ctx.lineTo(this.canvas.width, centerY);
                    this.ctx.stroke();
                    
                    // Eje Y
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX, 0);
                    this.ctx.lineTo(centerX, this.canvas.height);
                    this.ctx.stroke();
                    
                    // Etiquetas de ejes
                    this.ctx.font = '12px Arial';
                    this.ctx.fillStyle = '#495057';
                    this.ctx.fillText('x', this.canvas.width - 20, centerY - 10);
                    this.ctx.fillText('y', centerX + 10, 15);
                    this.ctx.fillText('O', centerX + 5, centerY - 5);
                },
                
                animar() {
                    if (this.isAnimating) return;
                    
                    this.isAnimating = true;
                    const animate = () => {
                        if (!this.isAnimating) return;
                        
                        this.currentX += 0.1;
                        if (this.currentX > 5) {
                            this.currentX = -5;
                        }
                        
                        const valorXElement = document.getElementById('valorXParV');
                        if (valorXElement) valorXElement.value = this.currentX;
                        
                        this.updateAll();
                        
                        this.animationId = requestAnimationFrame(animate);
                    };
                    
                    animate();
                },
                
                detenerAnimacion() {
                    this.isAnimating = false;
                    if (this.animationId) {
                        cancelAnimationFrame(this.animationId);
                        this.animationId = null;
                    }
                }
            } // End of app.parabolaVertical
            
            ,parabolaHorizontal: {
                canvas: null,
                ctx: null,
                animationId: null,
                isAnimating: false,
                currentY: 0,
                
                init() {
                    this.canvas = document.getElementById('canvasParabolaHorizontal');
                    if (!this.canvas) {
                        console.error('Canvas de parábola horizontal no encontrado');
                        return;
                    }
                    this.ctx = this.canvas.getContext('2d');
                    
                    // Inicializar valor por defecto del input
                    const valorYInput = document.getElementById('valorYParH');
                    if (valorYInput) {
                        this.currentY = parseFloat(valorYInput.value) || 0;
                    }
                    
                    this.setupEventListeners();
                    this.updateAll();
                    this.dibujar();
                },
                
                setupEventListeners() {
                    const coefAInput = document.getElementById('coefAParH');
                    const coefBInput = document.getElementById('coefBParH');
                    const coefCInput = document.getElementById('coefCParH');
                    const valorYInput = document.getElementById('valorYParH');
                    
                    if (coefAInput) coefAInput.addEventListener('input', () => this.updateAll());
                    if (coefBInput) coefBInput.addEventListener('input', () => this.updateAll());
                    if (coefCInput) coefCInput.addEventListener('input', () => this.updateAll());
                    if (valorYInput) {
                        valorYInput.addEventListener('input', () => {
                            this.currentY = parseFloat(valorYInput.value);
                            this.updateAll();
                        });
                    }
                },
                
                updateAll() {
                    // Verificar que A no sea cero para que sea una parábola válida
                    const AElement = document.getElementById('coefAParH');
                    if (AElement) {
                        let A = parseFloat(AElement.value);
                        if (A === 0) {
                            A = 0.1;
                            AElement.value = A;
                        }
                    }
                    
                    this.updateEcuaciones();
                    this.updatePropiedades();
                    this.updateInfoPunto();
                    this.updateEvaluacion();
                    this.dibujar();
                    
                    // Force MathJax reprocessing
                    setTimeout(() => {
                        if (typeof MathJax !== "undefined") {
                            if (MathJax.Hub) {
                                MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
                            } else if (MathJax.typesetPromise) {
                                MathJax.typesetPromise();
                            }
                        }
                    }, 100);
                },
                
                updateEcuaciones() {
                    const A = parseFloat(document.getElementById('coefAParH')?.value || 1);
                    const B = parseFloat(document.getElementById('coefBParH')?.value || 0);
                    const C = parseFloat(document.getElementById('coefCParH')?.value || -1);
                    
                    let ecuacion = `x = `;
                    let terminos = [];
                    
                    // Término cuadrático
                    if (A !== 0) {
                        if (A === 1) {
                            terminos.push('y^2');
                        } else if (A === -1) {
                            terminos.push('-y^2');
                        } else {
                            terminos.push(`${A}y^2`);
                        }
                    }
                    
                    // Término lineal
                    if (B !== 0) {
                        if (B === 1) {
                            terminos.push(terminos.length > 0 ? '+y' : 'y');
                        } else if (B === -1) {
                            terminos.push('-y');
                        } else if (B > 0) {
                            terminos.push(terminos.length > 0 ? `+${B}y` : `${B}y`);
                        } else {
                            terminos.push(`${B}y`);
                        }
                    }
                    
                    // Término constante
                    if (C !== 0) {
                        if (C > 0) {
                            terminos.push(terminos.length > 0 ? `+${C}` : `${C}`);
                        } else {
                            terminos.push(`${C}`);
                        }
                    }
                    
                    // Si no hay términos, mostrar 0
                    if (terminos.length === 0) {
                        ecuacion += '0';
                    } else {
                        ecuacion += terminos.join('');
                    }
                    
                    const ecuacionElement = document.getElementById('ecuacionParabolaHorizontal');
                    if (ecuacionElement) {
                        ecuacionElement.innerHTML = `$$${ecuacion}$$`;
                    }
                },
                
                updatePropiedades() {
                    const A = parseFloat(document.getElementById('coefAParH')?.value || 1);
                    const B = parseFloat(document.getElementById('coefBParH')?.value || 0);
                    const C = parseFloat(document.getElementById('coefCParH')?.value || -1);
                    
                    // Calcular vértice
                    const k = -B / (2 * A);
                    const h = C - (B * B) / (4 * A);
                    
                    // Calcular parámetro p
                    const p = 1 / (4 * A);
                    
                    // Calcular foco
                    const focoH = h + p;
                    const focoK = k;
                    
                    // Directriz
                    const directriz = h - p;
                    
                    // Orientación
                    const orientacion = A > 0 ? "Hacia la derecha" : "Hacia la izquierda";
                    
                    // Raíces
                    const discriminant = B * B - 4 * A * C;
                    let raicesText = "";
                    if (discriminant > 0) {
                        const y1 = (-B + Math.sqrt(discriminant)) / (2 * A);
                        const y2 = (-B - Math.sqrt(discriminant)) / (2 * A);
                        raicesText = `Raíces: y₁ = ${y1.toFixed(3)}, y₂ = ${y2.toFixed(3)}`;
                    } else if (discriminant === 0) {
                        const y = -B / (2 * A);
                        raicesText = `Raíz única: y = ${y.toFixed(3)}`;
                    } else {
                        raicesText = "No tiene raíces reales";
                    }
                    
                    // Actualizar elementos DOM
                    const propVerticeHElement = document.getElementById('propVerticeHParH');
                    const propVerticeKElement = document.getElementById('propVerticeKParH');
                    const propFocoHElement = document.getElementById('propFocoHParH');
                    const propFocoKElement = document.getElementById('propFocoKParH');
                    const propPElement = document.getElementById('propPParH');
                    const propDirectrizElement = document.getElementById('propDirectrizParH');
                    const propOrientacionElement = document.getElementById('propOrientacionParH');
                    const propRaicesElement = document.getElementById('propRaicesParH');
                    
                    if (propVerticeHElement) propVerticeHElement.textContent = h.toFixed(3);
                    if (propVerticeKElement) propVerticeKElement.textContent = k.toFixed(3);
                    if (propFocoHElement) propFocoHElement.textContent = focoH.toFixed(3);
                    if (propFocoKElement) propFocoKElement.textContent = focoK.toFixed(3);
                    if (propPElement) propPElement.textContent = Math.abs(p).toFixed(3);
                    if (propDirectrizElement) propDirectrizElement.textContent = directriz.toFixed(3);
                    if (propOrientacionElement) propOrientacionElement.textContent = orientacion;
                    if (propRaicesElement) propRaicesElement.textContent = raicesText;
                },
                
                updateEvaluacion() {
                    const A = parseFloat(document.getElementById('coefAParH')?.value || 1);
                    const B = parseFloat(document.getElementById('coefBParH')?.value || 0);
                    const C = parseFloat(document.getElementById('coefCParH')?.value || -1);
                    const y = this.currentY;
                    
                    const x = A * y * y + B * y + C;
                    
                    const valorYMostrarElement = document.getElementById('valorYMostrarParH');
                    const resultadoEvalElement = document.getElementById('resultadoEvalParH');
                    
                    if (valorYMostrarElement) valorYMostrarElement.textContent = y.toFixed(1);
                    if (resultadoEvalElement) resultadoEvalElement.textContent = x.toFixed(3);
                },
                
                updateInfoPunto() {
                    const A = parseFloat(document.getElementById('coefAParH')?.value || 1);
                    const B = parseFloat(document.getElementById('coefBParH')?.value || 0);
                    const C = parseFloat(document.getElementById('coefCParH')?.value || -1);
                    const y = this.currentY;
                    const x = A * y * y + B * y + C;
                    
                    // Calcular vértice y foco
                    const k = -B / (2 * A);
                    const h = C - (B * B) / (4 * A);
                    const p = 1 / (4 * A);
                    const focoH = h + p;
                    const focoK = k;
                    const directriz = h - p;
                    
                    // Calcular distancias
                    const distFoco = Math.sqrt((x - focoH) * (x - focoH) + (y - focoK) * (y - focoK));
                    const distDirectriz = Math.abs(x - directriz);
                    
                    const infoPuntoElement = document.getElementById('infoPuntoParH');
                    if (infoPuntoElement) {
                        infoPuntoElement.innerHTML = 
                            `Coordenadas: P(${x.toFixed(2)}, ${y.toFixed(2)})<br>` +
                            `Distancia al foco: ${distFoco.toFixed(3)}<br>` +
                            `Distancia a directriz: ${distDirectriz.toFixed(3)}`;
                    }
                },
                
                dibujar() {
                    if (!this.canvas || !this.ctx) return;
                    
                    const A = parseFloat(document.getElementById('coefAParH')?.value || 1);
                    const B = parseFloat(document.getElementById('coefBParH')?.value || 0);
                    const C = parseFloat(document.getElementById('coefCParH')?.value || -1);
                    
                    // Limpiar canvas
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Configurar sistema de coordenadas
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    const scale = 30; // píxeles por unidad
                    
                    // Dibujar grid y ejes
                    this.dibujarGrid(centerX, centerY, scale);
                    this.dibujarEjes(centerX, centerY);
                    
                    // Dibujar parábola horizontal
                    this.ctx.strokeStyle = '#6f42c1';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    
                    let first = true;
                    const rangeY = 7;
                    const step = 0.05;
                    
                    for (let y = -rangeY; y <= rangeY; y += step) {
                        const x = A * y * y + B * y + C;
                        const canvasX = centerX + x * scale;
                        const canvasY = centerY - y * scale;
                        
                        // Verificar si el punto está dentro del canvas con un margen
                        if (canvasX >= -50 && canvasX <= this.canvas.width + 50 && 
                            canvasY >= -50 && canvasY <= this.canvas.height + 50) {
                            if (first) {
                                this.ctx.moveTo(canvasX, canvasY);
                                first = false;
                            } else {
                                this.ctx.lineTo(canvasX, canvasY);
                            }
                        } else if (!first) {
                            // Si salimos del área visible, terminamos la línea actual
                            this.ctx.stroke();
                            first = true;
                        }
                    }
                    if (!first) {
                        this.ctx.stroke();
                    }
                    
                    // Calcular y dibujar elementos
                    const k = -B / (2 * A);
                    const h = C - (B * B) / (4 * A);
                    const p = 1 / (4 * A);
                    const focoH = h + p;
                    const focoK = k;
                    const directriz = h - p;
                    
                    // Dibujar vértice
                    const verticeCanvasX = centerX + h * scale;
                    const verticeCanvasY = centerY - k * scale;
                    this.ctx.beginPath();
                    this.ctx.arc(verticeCanvasX, verticeCanvasY, 6, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#dc3545';
                    this.ctx.fill();
                    
                    // Dibujar foco
                    const focoCanvasX = centerX + focoH * scale;
                    const focoCanvasY = centerY - focoK * scale;
                    this.ctx.beginPath();
                    this.ctx.arc(focoCanvasX, focoCanvasY, 5, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#28a745';
                    this.ctx.fill();
                    
                    // Dibujar directriz
                    const directrizCanvasX = centerX + directriz * scale;
                    this.ctx.strokeStyle = '#fd7e14';
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([5, 5]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(directrizCanvasX, 0);
                    this.ctx.lineTo(directrizCanvasX, this.canvas.height);
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                    
                    // Dibujar punto actual
                    const y = this.currentY;
                    const x = A * y * y + B * y + C;
                    const puntoCanvasX = centerX + x * scale;
                    const puntoCanvasY = centerY - y * scale;
                    this.ctx.beginPath();
                    this.ctx.arc(puntoCanvasX, puntoCanvasY, 5, 0, 2 * Math.PI);
                    this.ctx.fillStyle = '#ffc107';
                    this.ctx.fill();
                    
                    // Líneas desde punto al foco y a la directriz
                    this.ctx.strokeStyle = '#20c997';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(puntoCanvasX, puntoCanvasY);
                    this.ctx.lineTo(focoCanvasX, focoCanvasY);
                    this.ctx.stroke();
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(puntoCanvasX, puntoCanvasY);
                    this.ctx.lineTo(directrizCanvasX, puntoCanvasY);
                    this.ctx.stroke();
                    
                    // Etiquetas
                    this.ctx.font = '12px Arial';
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillText(`V(${h.toFixed(1)}, ${k.toFixed(1)})`, verticeCanvasX + 8, verticeCanvasY - 8);
                    this.ctx.fillText(`F(${focoH.toFixed(1)}, ${focoK.toFixed(1)})`, focoCanvasX + 8, focoCanvasY - 8);
                    this.ctx.fillText(`P(${x.toFixed(1)}, ${y.toFixed(1)})`, puntoCanvasX + 8, puntoCanvasY - 8);
                },
                
                dibujarGrid(centerX, centerY, scale) {
                    this.ctx.strokeStyle = '#e9ecef';
                    this.ctx.lineWidth = 0.5;
                    
                    // Líneas verticales
                    for (let i = -10; i <= 10; i++) {
                        const x = centerX + i * scale;
                        this.ctx.beginPath();
                        this.ctx.moveTo(x, 0);
                        this.ctx.lineTo(x, this.canvas.height);
                        this.ctx.stroke();
                    }
                    
                    // Líneas horizontales
                    for (let i = -7; i <= 7; i++) {
                        const y = centerY + i * scale;
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, y);
                        this.ctx.lineTo(this.canvas.width, y);
                        this.ctx.stroke();
                    }
                },
                
                dibujarEjes(centerX, centerY) {
                    this.ctx.strokeStyle = '#6c757d';
                    this.ctx.lineWidth = 1;
                    
                    // Eje X
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, centerY);
                    this.ctx.lineTo(this.canvas.width, centerY);
                    this.ctx.stroke();
                    
                    // Eje Y
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX, 0);
                    this.ctx.lineTo(centerX, this.canvas.height);
                    this.ctx.stroke();
                    
                    // Etiquetas de ejes
                    this.ctx.font = '12px Arial';
                    this.ctx.fillStyle = '#495057';
                    this.ctx.fillText('x', this.canvas.width - 20, centerY - 10);
                    this.ctx.fillText('y', centerX + 10, 15);
                    this.ctx.fillText('O', centerX + 5, centerY - 5);
                },
                
                animar() {
                    if (this.isAnimating) return;
                    
                    this.isAnimating = true;
                    const animate = () => {
                        if (!this.isAnimating) return;
                        
                        this.currentY += 0.1;
                        if (this.currentY > 5) {
                            this.currentY = -5;
                        }
                        
                        const valorYElement = document.getElementById('valorYParH');
                        if (valorYElement) valorYElement.value = this.currentY;
                        
                        this.updateAll();
                        
                        this.animationId = requestAnimationFrame(animate);
                    };
                    
                    animate();
                },
                
                detenerAnimacion() {
                    this.isAnimating = false;
                    if (this.animationId) {
                        cancelAnimationFrame(this.animationId);
                        this.animationId = null;
                    }
                }
            } // End of app.parabolaHorizontal
            
            ,sistemaRectas: {
                canvas: null,
                ctx: null,
                escala: 30,  // Píxeles por unidad
                tipoActual: 'rectaCirculo',
                formaRecta: 'general',
                basePanelRectaHTML: '',
                basePanelSecundariosHTML: '',
                usaPanelRectaOriginal: true,
                conicSystems: {
                    circuloCirculo: {
                        figura1: { tipo: 'circulo', prefix: 'circulo1', titulo: 'Círculo 1', color: '#0066cc' },
                        figura2: { tipo: 'circulo', prefix: 'circulo2', titulo: 'Círculo 2', color: '#00b894', defaults: { h: 2, k: 0, r: 2.5 } }
                    },
                    circuloParabola: {
                        figura1: { tipo: 'circulo', prefix: 'circulo1', titulo: 'Círculo', color: '#0066cc', defaults: { r: 3 } },
                        figura2: { tipo: 'parabola', prefix: 'parabola2', titulo: 'Parábola', color: '#9c27b0', defaults: { tipoParabola: 'vertical', a: 0.5, h: -1, k: -1 } }
                    },
                    circuloElipse: {
                        figura1: { tipo: 'circulo', prefix: 'circulo1', titulo: 'Círculo', color: '#0066cc', defaults: { r: 3 } },
                        figura2: { tipo: 'elipse', prefix: 'elipse2', titulo: 'Elipse', color: '#d84315', defaults: { h: 1, k: 0, a: 4, b: 2 } }
                    },
                    circuloHiperbola: {
                        figura1: { tipo: 'circulo', prefix: 'circulo1', titulo: 'Círculo', color: '#0066cc', defaults: { r: 3 } },
                        figura2: { tipo: 'hiperbola', prefix: 'hiperbola2', titulo: 'Hipérbola', color: '#ff9800', defaults: { a: 3, b: 1.5 } }
                    },
                    parabolaParabola: {
                        figura1: { tipo: 'parabola', prefix: 'parabola1', titulo: 'Parábola 1', color: '#9c27b0', defaults: { tipoParabola: 'vertical', a: 0.5, h: -1, k: 0 } },
                        figura2: { tipo: 'parabola', prefix: 'parabola2', titulo: 'Parábola 2', color: '#0097a7', defaults: { tipoParabola: 'horizontal', a: 0.4, h: 1, k: 0 } }
                    },
                    parabolaElipse: {
                        figura1: { tipo: 'parabola', prefix: 'parabola1', titulo: 'Parábola', color: '#9c27b0', defaults: { tipoParabola: 'vertical', a: 0.4, h: -1, k: -1 } },
                        figura2: { tipo: 'elipse', prefix: 'elipse2', titulo: 'Elipse', color: '#d84315', defaults: { a: 4, b: 2 } }
                    },
                    parabolaHiperbola: {
                        figura1: { tipo: 'parabola', prefix: 'parabola1', titulo: 'Parábola', color: '#9c27b0', defaults: { tipoParabola: 'vertical', a: 0.5, h: -2, k: 0 } },
                        figura2: { tipo: 'hiperbola', prefix: 'hiperbola2', titulo: 'Hipérbola', color: '#ff9800', defaults: { a: 3, b: 1.5, orientacion: 'horizontal' } }
                    },
                    elipseElipse: {
                        figura1: { tipo: 'elipse', prefix: 'elipse1', titulo: 'Elipse 1', color: '#d84315', defaults: { h: -1, k: 0, a: 4, b: 2 } },
                        figura2: { tipo: 'elipse', prefix: 'elipse2', titulo: 'Elipse 2', color: '#00acc1', defaults: { h: 1, k: 0, a: 3, b: 1.5 } }
                    },
                    elipseHiperbola: {
                        figura1: { tipo: 'elipse', prefix: 'elipse1', titulo: 'Elipse', color: '#d84315', defaults: { h: 0, k: 0, a: 4, b: 2 } },
                        figura2: { tipo: 'hiperbola', prefix: 'hiperbola2', titulo: 'Hipérbola', color: '#ff9800', defaults: { h: 0, k: 0, a: 3, b: 1.5, orientacion: 'vertical' } }
                    }
                },
                
                init: function() {
                    this.canvas = document.getElementById('sistemaRectasCanvas');
                    if (!this.canvas) return;
                    
                    this.ctx = this.canvas.getContext('2d');
                    
                    const panelRecta = document.getElementById('parametrosRecta');
                    const panelSecundario = document.getElementById('parametrosSecundarios');
                    if (panelRecta && !this.basePanelRectaHTML) {
                        this.basePanelRectaHTML = panelRecta.innerHTML;
                    }
                    if (panelSecundario && !this.basePanelSecundariosHTML) {
                        this.basePanelSecundariosHTML = panelSecundario.innerHTML;
                    }
                    
                    // Configurar listeners para el cambio de sistema
                    document.getElementById('tipoSistema').addEventListener('change', (e) => {
                        this.tipoActual = e.target.value;
                        this.actualizarParametrosSecundarios();
                        this.recalcularYDibujar();
                    });
                    
                    this.configurarListenersRecta();
                    
                    // Inicialización
                    this.actualizarParametrosSecundarios();
                    this.mostrarParametrosRecta();
                    this.recalcularYDibujar();
                },
                
                configurarListenersRecta: function() {
                    const rectaFormaSelect = document.getElementById('rectaForma');
                    if (rectaFormaSelect) {
                        this.formaRecta = rectaFormaSelect.value || 'general';
                        if (!rectaFormaSelect.dataset.listenerRecta) {
                            rectaFormaSelect.addEventListener('change', (e) => {
                                this.formaRecta = e.target.value;
                                this.mostrarParametrosRecta();
                                this.recalcularYDibujar();
                            });
                            rectaFormaSelect.dataset.listenerRecta = 'true';
                        }
                    }
                    
                    const rectaInputs = document.querySelectorAll('#parametrosRecta input');
                    rectaInputs.forEach(input => {
                        if (!input.dataset.listenerRecta) {
                            input.addEventListener('input', () => this.recalcularYDibujar());
                            input.dataset.listenerRecta = 'true';
                        }
                    });
                },
                
                mostrarParametrosRecta: function() {
                    const generalParams = document.getElementById('rectaGeneralParams');
                    const pendienteParams = document.getElementById('rectaPendienteParams');
                    const puntoParams = document.getElementById('rectaPuntoParams');
                    
                    if (!generalParams || !pendienteParams || !puntoParams) {
                        return;
                    }
                    
                    // Ocultar todos los conjuntos de parámetros
                    generalParams.style.display = 'none';
                    pendienteParams.style.display = 'none';
                    puntoParams.style.display = 'none';
                    
                    // Mostrar solo el conjunto activo
                    switch (this.formaRecta) {
                        case 'general':
                            generalParams.style.display = 'flex';
                            break;
                        case 'pendiente':
                            pendienteParams.style.display = 'flex';
                            break;
                        case 'punto':
                            puntoParams.style.display = 'flex';
                            break;
                    }
                },
                
                actualizarParametrosSecundarios: function() {
                    const contenedor = document.getElementById('parametrosSecundarios');
                    const panelRecta = document.getElementById('parametrosRecta');
                    let html = '';
                    
                    const conicConfig = this.conicSystems[this.tipoActual];
                    if (conicConfig) {
                        if (panelRecta) {
                            panelRecta.innerHTML = this.generarFormularioFigura(conicConfig.figura1);
                        }
                        this.usaPanelRectaOriginal = false;
                        contenedor.innerHTML = this.generarFormularioFigura(conicConfig.figura2);
                        this.registrarEventosFigura(conicConfig.figura1);
                        this.registrarEventosFigura(conicConfig.figura2);
                        return;
                    }
                    
                    if (!this.usaPanelRectaOriginal && panelRecta && this.basePanelRectaHTML) {
                        panelRecta.innerHTML = this.basePanelRectaHTML;
                        this.usaPanelRectaOriginal = true;
                        this.configurarListenersRecta();
                        this.mostrarParametrosRecta();
                    }
                    
                    switch (this.tipoActual) {
                        case 'rectaCirculo':
                            html = `
                                <h4>Parámetros del Círculo</h4>
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Centro h:</label>
                                        <input type="number" class="form-control" id="circuloCentroH" value="0" step="0.1">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Centro k:</label>
                                        <input type="number" class="form-control" id="circuloCentroK" value="0" step="0.1">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Radio r:</label>
                                        <input type="number" class="form-control" id="circuloRadio" value="3" min="0.1" step="0.1">
                                    </div>
                                </div>
                            `;
                            break;
                        case 'rectaParabola':
                            html = `
                                <h4>Parámetros de la Parábola</h4>
                                <div class="form-group mb-3">
                                    <label class="form-label">Tipo:</label>
                                    <select class="form-select" id="parabolaTipo">
                                        <option value="vertical">Vertical: y = a(x-h)² + k</option>
                                        <option value="horizontal">Horizontal: x = a(y-k)² + h</option>
                                    </select>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Vértice h:</label>
                                        <input type="number" class="form-control" id="parabolaH" value="0" step="0.1">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Vértice k:</label>
                                        <input type="number" class="form-control" id="parabolaK" value="0" step="0.1">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">a:</label>
                                        <input type="number" class="form-control" id="parabolaA" value="0.5" step="0.1">
                                    </div>
                                </div>
                            `;
                            break;
                        case 'rectaRecta':
                            html = `
                                <h4>Parámetros de la Segunda Recta</h4>
                                <div class="mb-3">
                                    <label class="form-label">Forma:</label>
                                    <select class="form-select" id="recta2Forma">
                                        <option value="general">General: Ax + By + C = 0</option>
                                        <option value="pendiente">Pendiente: y = mx + b</option>
                                    </select>
                                </div>
                                <div class="row mb-3" id="recta2GeneralParams">
                                    <div class="col-md-4">
                                        <label class="form-label">A:</label>
                                        <input type="number" class="form-control" id="recta2A" value="1" step="0.1">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">B:</label>
                                        <input type="number" class="form-control" id="recta2B" value="-1" step="0.1">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">C:</label>
                                        <input type="number" class="form-control" id="recta2C" value="0" step="0.1">
                                    </div>
                                </div>
                                <div class="row mb-3" id="recta2PendienteParams" style="display:none;">
                                    <div class="col-md-6">
                                        <label class="form-label">m (pendiente):</label>
                                        <input type="number" class="form-control" id="recta2M" value="-1" step="0.1">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">b (intersección y):</label>
                                        <input type="number" class="form-control" id="recta2B2" value="0" step="0.1">
                                    </div>
                                </div>
                            `;
                            break;
                        case 'rectaElipse':
                            html = `
                                <h4>Parámetros de la Elipse</h4>
                                <div class="row mb-3">
                                    <div class="col-md-3">
                                        <label class="form-label">Centro h:</label>
                                        <input type="number" class="form-control" id="elipseCentroH" value="0" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Centro k:</label>
                                        <input type="number" class="form-control" id="elipseCentroK" value="0" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Semieje a:</label>
                                        <input type="number" class="form-control" id="elipseA" value="4" min="0.1" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Semieje b:</label>
                                        <input type="number" class="form-control" id="elipseB" value="2" min="0.1" step="0.1">
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">Orientación:</label>
                                    <select class="form-select" id="elipseOrientacion">
                                        <option value="horizontal">Horizontal (eje mayor en x)</option>
                                        <option value="vertical">Vertical (eje mayor en y)</option>
                                    </select>
                                </div>
                            `;
                            break;
                        case 'rectaHiperbola':
                            html = `
                                <h4>Parámetros de la Hipérbola</h4>
                                <div class="row mb-3">
                                    <div class="col-md-3">
                                        <label class="form-label">Centro h:</label>
                                        <input type="number" class="form-control" id="hiperbolaCentroH" value="0" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Centro k:</label>
                                        <input type="number" class="form-control" id="hiperbolaCentroK" value="0" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Semieje a:</label>
                                        <input type="number" class="form-control" id="hiperbolaA" value="3" min="0.1" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Semieje b:</label>
                                        <input type="number" class="form-control" id="hiperbolaB" value="2" min="0.1" step="0.1">
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">Orientación:</label>
                                    <select class="form-select" id="hiperbolaOrientacion">
                                        <option value="horizontal">Horizontal (eje transversal en x)</option>
                                        <option value="vertical">Vertical (eje transversal en y)</option>
                                    </select>
                                </div>
                            `;
                            break;
                    }
                    
                    contenedor.innerHTML = html;
                    
                    // Configurar event listeners para los nuevos campos
                    const inputs = contenedor.querySelectorAll('input, select');
                    inputs.forEach(input => {
                        input.addEventListener('input', () => this.recalcularYDibujar());
                    });
                    
                    // Event listeners específicos para ciertas configuraciones
                    if (this.tipoActual === 'rectaRecta') {
                        const forma2Select = document.getElementById('recta2Forma');
                        if (forma2Select) {
                            forma2Select.addEventListener('change', () => {
                                document.getElementById('recta2GeneralParams').style.display = 
                                    forma2Select.value === 'general' ? 'flex' : 'none';
                                document.getElementById('recta2PendienteParams').style.display = 
                                    forma2Select.value === 'pendiente' ? 'flex' : 'none';
                                this.recalcularYDibujar();
                            });
                        }
                    }
                },

                generarFormularioFigura: function(fig) {
                    if (!fig || !fig.tipo) return '';
                    const defaults = Object.assign({
                        h: 0,
                        k: 0,
                        r: 3,
                        a: 3,
                        b: 2,
                        orientacion: 'horizontal',
                        tipoParabola: 'vertical'
                    }, fig.defaults || {});
                    
                    switch (fig.tipo) {
                        case 'circulo':
                            return `
                                <h4>${fig.titulo || 'Círculo'}</h4>
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Centro h:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}CentroH" value="${defaults.h}" step="0.1">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Centro k:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}CentroK" value="${defaults.k}" step="0.1">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Radio r:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}Radio" value="${defaults.r}" min="0.1" step="0.1">
                                    </div>
                                </div>
                            `;
                        case 'parabola':
                            return `
                                <h4>${fig.titulo || 'Parábola'}</h4>
                                <div class="form-group mb-3">
                                    <label class="form-label">Tipo:</label>
                                    <select class="form-select" id="${fig.prefix}Tipo">
                                        <option value="vertical" ${defaults.tipoParabola === 'vertical' ? 'selected' : ''}>Vertical: y = a(x-h)² + k</option>
                                        <option value="horizontal" ${defaults.tipoParabola === 'horizontal' ? 'selected' : ''}>Horizontal: x = a(y-k)² + h</option>
                                    </select>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Vértice h:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}H" value="${defaults.h}" step="0.1">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">Vértice k:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}K" value="${defaults.k}" step="0.1">
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label">a:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}A" value="${defaults.a || 0.5}" step="0.1">
                                    </div>
                                </div>
                            `;
                        case 'elipse':
                            return `
                                <h4>${fig.titulo || 'Elipse'}</h4>
                                <div class="row mb-3">
                                    <div class="col-md-3">
                                        <label class="form-label">Centro h:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}CentroH" value="${defaults.h}" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Centro k:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}CentroK" value="${defaults.k}" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Semieje a:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}A" value="${defaults.a}" min="0.1" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Semieje b:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}B" value="${defaults.b}" min="0.1" step="0.1">
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">Orientación:</label>
                                    <select class="form-select" id="${fig.prefix}Orientacion">
                                        <option value="horizontal" ${defaults.orientacion === 'horizontal' ? 'selected' : ''}>Eje mayor horizontal</option>
                                        <option value="vertical" ${defaults.orientacion === 'vertical' ? 'selected' : ''}>Eje mayor vertical</option>
                                    </select>
                                </div>
                            `;
                        case 'hiperbola':
                            return `
                                <h4>${fig.titulo || 'Hipérbola'}</h4>
                                <div class="row mb-3">
                                    <div class="col-md-3">
                                        <label class="form-label">Centro h:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}CentroH" value="${defaults.h}" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Centro k:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}CentroK" value="${defaults.k}" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Semieje a:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}A" value="${defaults.a}" min="0.1" step="0.1">
                                    </div>
                                    <div class="col-md-3">
                                        <label class="form-label">Semieje b:</label>
                                        <input type="number" class="form-control" id="${fig.prefix}B" value="${defaults.b}" min="0.1" step="0.1">
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label class="form-label">Orientación:</label>
                                    <select class="form-select" id="${fig.prefix}Orientacion">
                                        <option value="horizontal" ${defaults.orientacion === 'horizontal' ? 'selected' : ''}>Transversal horizontal</option>
                                        <option value="vertical" ${defaults.orientacion === 'vertical' ? 'selected' : ''}>Transversal vertical</option>
                                    </select>
                                </div>
                            `;
                        default:
                            return '';
                    }
                },

                registrarEventosFigura: function(fig) {
                    if (!fig || !fig.prefix) return;
                    const addListener = (id, event = 'input') => {
                        const el = document.getElementById(id);
                        if (el && !el.dataset.listenerSistema) {
                            el.addEventListener(event, () => this.recalcularYDibujar());
                            el.dataset.listenerSistema = 'true';
                        }
                    };
                    
                    switch (fig.tipo) {
                        case 'circulo':
                            ['CentroH', 'CentroK', 'Radio'].forEach(sufijo => addListener(`${fig.prefix}${sufijo}`));
                            break;
                        case 'parabola':
                            addListener(`${fig.prefix}Tipo`, 'change');
                            ['H', 'K', 'A'].forEach(sufijo => addListener(`${fig.prefix}${sufijo}`));
                            break;
                        case 'elipse':
                            ['CentroH', 'CentroK', 'A', 'B'].forEach(sufijo => addListener(`${fig.prefix}${sufijo}`));
                            addListener(`${fig.prefix}Orientacion`, 'change');
                            break;
                        case 'hiperbola':
                            ['CentroH', 'CentroK', 'A', 'B'].forEach(sufijo => addListener(`${fig.prefix}${sufijo}`));
                            addListener(`${fig.prefix}Orientacion`, 'change');
                            break;
                        default:
                            break;
                    }
                },
                
                recalcularYDibujar: function() {
                    this.dibujar();
                    this.calcularSolucion();
                },
                
                dibujar: function() {
                    const canvas = this.canvas;
                    const ctx = this.ctx;
                    const width = canvas.width;
                    const height = canvas.height;
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const escala = this.escala;
                    
                    // Limpiar canvas
                    ctx.clearRect(0, 0, width, height);
                    
                    // Dibujar ejes
                    this.dibujarEjes(centerX, centerY);
                    
                    // Dibujar grid
                    this.dibujarGrid(centerX, centerY, escala);
                    
                    const conicConfig = this.conicSystems[this.tipoActual];
                    
                    if (!conicConfig) {
                        const parametrosRecta = this.obtenerParametrosRecta();
                        if (parametrosRecta) {
                            this.dibujarRecta(parametrosRecta.A, parametrosRecta.B, parametrosRecta.C, '#ff6600', 2);
                        }
                    }
                    
                    if (conicConfig) {
                        const paramsFigura1 = this.obtenerParametrosFigura(conicConfig.figura1);
                        const paramsFigura2 = this.obtenerParametrosFigura(conicConfig.figura2);
                        this.dibujarFiguraGenerica(conicConfig.figura1, paramsFigura1);
                        this.dibujarFiguraGenerica(conicConfig.figura2, paramsFigura2);
                        return;
                    }
                    
                    // Dibujar figura secundaria según el tipo de sistema con recta
                    switch (this.tipoActual) {
                        case 'rectaCirculo':
                            this.dibujarCirculo();
                            break;
                        case 'rectaParabola':
                            this.dibujarParabola();
                            break;
                        case 'rectaRecta':
                            this.dibujarSegundaRecta();
                            break;
                        case 'rectaElipse':
                            this.dibujarElipse();
                            break;
                        case 'rectaHiperbola':
                            this.dibujarHiperbola();
                            break;
                    }
                },
                
                obtenerParametrosFigura: function(fig) {
                    if (!fig || !fig.tipo) return null;
                    switch (fig.tipo) {
                        case 'circulo':
                            return Object.assign({ tipo: 'circulo' }, this.getCirculoParams(fig.prefix));
                        case 'parabola':
                            return Object.assign({ tipo: 'parabola' }, this.getParabolaParams(fig.prefix));
                        case 'elipse':
                            return Object.assign({ tipo: 'elipse' }, this.getElipseParams(fig.prefix));
                        case 'hiperbola':
                            return Object.assign({ tipo: 'hiperbola' }, this.getHiperbolaParams(fig.prefix));
                        default:
                            return null;
                    }
                },
                
                dibujarFiguraGenerica: function(fig, params) {
                    if (!fig || !params) return;
                    const color = fig.color || '#2c3e50';
                    switch (fig.tipo) {
                        case 'circulo':
                            this.dibujarCirculo({ prefix: fig.prefix, color });
                            break;
                        case 'parabola':
                            this.dibujarParabola({ prefix: fig.prefix, color });
                            break;
                        case 'elipse':
                            this.dibujarElipse({ prefix: fig.prefix, color });
                            break;
                        case 'hiperbola':
                            this.dibujarHiperbola({ prefix: fig.prefix, color });
                            break;
                        default:
                            break;
                    }
                },
                
                dibujarGrid: function(centerX, centerY, escala) {
                    const ctx = this.ctx;
                    const width = this.canvas.width;
                    const height = this.canvas.height;
                    
                    ctx.strokeStyle = '#e6e6e6';
                    ctx.lineWidth = 0.5;
                    
                    // Dibujar líneas horizontales
                    for (let y = centerY % escala; y < height; y += escala) {
                        ctx.beginPath();
                        ctx.moveTo(0, y);
                        ctx.lineTo(width, y);
                        ctx.stroke();
                    }
                    
                    // Dibujar líneas verticales
                    for (let x = centerX % escala; x < width; x += escala) {
                        ctx.beginPath();
                        ctx.moveTo(x, 0);
                        ctx.lineTo(x, height);
                        ctx.stroke();
                    }
                    
                    // Números en los ejes
                    ctx.fillStyle = '#333';
                    ctx.font = '10px Arial';
                    
                    // Eje X
                    for (let i = -Math.floor(centerX / escala); i <= Math.floor((width - centerX) / escala); i++) {
                        if (i !== 0) {
                            const x = centerX + i * escala;
                            ctx.beginPath();
                            ctx.moveTo(x, centerY - 3);
                            ctx.lineTo(x, centerY + 3);
                            ctx.stroke();
                            ctx.fillText(i.toString(), x - 3, centerY + 15);
                        }
                    }
                    
                    // Eje Y
                    for (let i = -Math.floor(centerY / escala); i <= Math.floor((height - centerY) / escala); i++) {
                        if (i !== 0) {
                            const y = centerY + i * escala;
                            ctx.beginPath();
                            ctx.moveTo(centerX - 3, y);
                            ctx.lineTo(centerX + 3, y);
                            ctx.stroke();
                            ctx.fillText((-i).toString(), centerX + 8, y + 3);
                        }
                    }
                },
                
                dibujarEjes: function(centerX, centerY) {
                    const ctx = this.ctx;
                    const width = this.canvas.width;
                    const height = this.canvas.height;
                    
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 1;
                    
                    // Eje X
                    ctx.beginPath();
                    ctx.moveTo(0, centerY);
                    ctx.lineTo(width, centerY);
                    ctx.stroke();
                    
                    // Eje Y
                    ctx.beginPath();
                    ctx.moveTo(centerX, 0);
                    ctx.lineTo(centerX, height);
                    ctx.stroke();
                    
                    // Etiquetas
                    ctx.fillStyle = '#333';
                    ctx.font = '12px Arial';
                    ctx.fillText('X', width - 15, centerY - 8);
                    ctx.fillText('Y', centerX + 8, 15);
                    ctx.fillText('O', centerX - 15, centerY + 15);
                },
                
                obtenerParametrosRecta: function() {
                    const formaSelect = document.getElementById('rectaForma');
                    if (!formaSelect) {
                        return null;
                    }
                    
                    let A = 0, B = 0, C = 0;
                    
                    switch (this.formaRecta) {
                        case 'general':
                            const rectaA = document.getElementById('rectaA');
                            const rectaB = document.getElementById('rectaB');
                            const rectaC = document.getElementById('rectaC');
                            if (!rectaA || !rectaB || !rectaC) return null;
                            A = parseFloat(rectaA.value);
                            B = parseFloat(rectaB.value);
                            C = parseFloat(rectaC.value);
                            break;
                        case 'pendiente':
                            const rectaM = document.getElementById('rectaM');
                            const rectaB2 = document.getElementById('rectaB2');
                            if (!rectaM || !rectaB2) return null;
                            const m = parseFloat(rectaM.value);
                            const b = parseFloat(rectaB2.value);
                            A = m;
                            B = -1;
                            C = b;
                            break;
                        case 'punto':
                            const rectaX1 = document.getElementById('rectaX1');
                            const rectaY1 = document.getElementById('rectaY1');
                            const rectaM2 = document.getElementById('rectaM2');
                            if (!rectaX1 || !rectaY1 || !rectaM2) return null;
                            const x1 = parseFloat(rectaX1.value);
                            const y1 = parseFloat(rectaY1.value);
                            const m2 = parseFloat(rectaM2.value);
                            A = m2;
                            B = -1;
                            C = y1 - m2 * x1;
                            break;
                    }
                    
                    return { A, B, C };
                },
                
                getNumberValue: function(id, fallback = 0) {
                    const el = document.getElementById(id);
                    if (!el) return fallback;
                    const value = parseFloat(el.value);
                    return Number.isFinite(value) ? value : fallback;
                },
                
                formatNumber: function(value, digits = 4) {
                    if (!Number.isFinite(value)) return '0';
                    const rounded = Number.parseFloat(value.toFixed(digits));
                    if (Math.abs(rounded) < Math.pow(10, -digits)) {
                        return '0';
                    }
                    return rounded.toString();
                },
                
                getCirculoParams: function(prefix = 'circulo') {
                    return {
                        h: this.getNumberValue(`${prefix}CentroH`, 0),
                        k: this.getNumberValue(`${prefix}CentroK`, 0),
                        r: Math.max(0.1, this.getNumberValue(`${prefix}Radio`, 3))
                    };
                },
                
                getParabolaParams: function(prefix = 'parabola') {
                    const tipoSelect = document.getElementById(`${prefix}Tipo`);
                    let aValue = this.getNumberValue(`${prefix}A`, 0.5);
                    if (Math.abs(aValue) < 0.01) {
                        aValue = aValue >= 0 ? 0.01 : -0.01;
                    }
                    return {
                        h: this.getNumberValue(`${prefix}H`, 0),
                        k: this.getNumberValue(`${prefix}K`, 0),
                        a: aValue,
                        tipo: tipoSelect ? tipoSelect.value : 'vertical'
                    };
                },
                
                getElipseParams: function(prefix = 'elipse') {
                    const orientacionSelect = document.getElementById(`${prefix}Orientacion`);
                    return {
                        h: this.getNumberValue(`${prefix}CentroH`, 0),
                        k: this.getNumberValue(`${prefix}CentroK`, 0),
                        a: Math.max(0.1, this.getNumberValue(`${prefix}A`, 5)),
                        b: Math.max(0.1, this.getNumberValue(`${prefix}B`, 3)),
                        orientacion: orientacionSelect ? orientacionSelect.value : 'horizontal'
                    };
                },
                
                getHiperbolaParams: function(prefix = 'hiperbola') {
                    const orientacionSelect = document.getElementById(`${prefix}Orientacion`);
                    return {
                        h: this.getNumberValue(`${prefix}CentroH`, 0),
                        k: this.getNumberValue(`${prefix}CentroK`, 0),
                        a: Math.max(0.1, this.getNumberValue(`${prefix}A`, 3)),
                        b: Math.max(0.1, this.getNumberValue(`${prefix}B`, 2)),
                        orientacion: orientacionSelect ? orientacionSelect.value : 'horizontal'
                    };
                },
                
                actualizarListadoIntersecciones: function(container, puntos) {
                    if (!container) return;
                    let html = "<h5>Puntos de Intersección:</h5>";
                    if (!puntos || puntos.length === 0) {
                        html += "<p>No hay puntos de intersección.</p>";
                    } else {
                        html += "<ul>";
                        puntos.forEach((punto, index) => {
                            const x = Number.isFinite(punto.x) ? punto.x.toFixed(2) : '—';
                            const y = Number.isFinite(punto.y) ? punto.y.toFixed(2) : '—';
                            html += `<li>P${index + 1}(${x}, ${y})</li>`;
                        });
                        html += "</ul>";
                    }
                    container.innerHTML = html;
                },
                
                resolverSistemaConicas: function(config, params1, params2) {
                    const ecuacion1 = this.formatearEcuacionFigura(config.figura1, params1);
                    const ecuacion2 = this.formatearEcuacionFigura(config.figura2, params2);
                    
                    if (this.figurasCoinciden(config.figura1, params1, config.figura2, params2)) {
                        return {
                            ecuacion1,
                            ecuacion2,
                            mensaje: '<p>Las curvas son coincidentes: existen infinitas soluciones.</p>',
                            intersecciones: []
                        };
                    }
                    
                    const resultado = this.buscarInterseccionesConicas(config.figura1, params1, config.figura2, params2);
                    const puntos = resultado.puntos || [];
                    let mensaje;
                    
                    if (resultado.estado === 'sinInterseccion') {
                        mensaje = `<p>${resultado.mensaje || 'No se detectaron intersecciones reales.'}</p>`;
                    } else if (puntos.length === 0) {
                        mensaje = '<p>No se detectaron intersecciones reales.</p>';
                    } else if (puntos.length === 1) {
                        mensaje = '<p>Las curvas son tangentes: un punto de intersección.</p>';
                    } else {
                        mensaje = `<p>Se encontraron ${puntos.length} puntos de intersección reales.</p>`;
                    }
                    
                    return {
                        ecuacion1,
                        ecuacion2,
                        mensaje,
                        intersecciones: puntos
                    };
                },
                
                formatearEcuacionFigura: function(fig, params) {
                    if (!fig || !params) return '';
                    const fn = this.formatNumber.bind(this);
                    switch (fig.tipo) {
                        case 'circulo':
                            return `(x - ${fn(params.h)})² + (y - ${fn(params.k)})² = ${fn(params.r)}²`;
                        case 'parabola':
                            if (params.tipo === 'vertical') {
                                return `y = ${fn(params.a)}(x - ${fn(params.h)})² + ${fn(params.k)}`;
                            }
                            return `x = ${fn(params.a)}(y - ${fn(params.k)})² + ${fn(params.h)}`;
                        case 'elipse':
                            return `((x - ${fn(params.h)})² / ${fn(params.a)}²) + ((y - ${fn(params.k)})² / ${fn(params.b)}²) = 1`;
                        case 'hiperbola':
                            if (params.orientacion === 'vertical') {
                                return `((y - ${fn(params.k)})² / ${fn(params.a)}²) - ((x - ${fn(params.h)})² / ${fn(params.b)}²) = 1`;
                            }
                            return `((x - ${fn(params.h)})² / ${fn(params.a)}²) - ((y - ${fn(params.k)})² / ${fn(params.b)}²) = 1`;
                        default:
                            return '';
                    }
                },
                
                figurasCoinciden: function(fig1, params1, fig2, params2) {
                    if (!fig1 || !fig2) return false;
                    if (fig1.tipo !== fig2.tipo) return false;
                    const tol = 1e-4;
                    const iguales = (a, b) => Math.abs(a - b) < tol;
                    
                    switch (fig1.tipo) {
                        case 'circulo':
                            return iguales(params1.h, params2.h) &&
                                   iguales(params1.k, params2.k) &&
                                   iguales(params1.r, params2.r);
                        case 'parabola':
                            return params1.tipo === params2.tipo &&
                                   iguales(params1.h, params2.h) &&
                                   iguales(params1.k, params2.k) &&
                                   iguales(params1.a, params2.a);
                        case 'elipse':
                            return iguales(params1.h, params2.h) &&
                                   iguales(params1.k, params2.k) &&
                                   iguales(params1.a, params2.a) &&
                                   iguales(params1.b, params2.b);
                        case 'hiperbola':
                            return params1.orientacion === params2.orientacion &&
                                   iguales(params1.h, params2.h) &&
                                   iguales(params1.k, params2.k) &&
                                   iguales(params1.a, params2.a) &&
                                   iguales(params1.b, params2.b);
                        default:
                            return false;
                    }
                },
                
                buscarInterseccionesConicas: function(fig1, params1, fig2, params2) {
                    const bounds1 = this.obtenerBoundsFigura(fig1, params1);
                    const bounds2 = this.obtenerBoundsFigura(fig2, params2);
                    const bounds = this.combinarBounds(bounds1, bounds2);
                    
                    let seeds = this.generarSemillas(fig1, params1, fig2, params2, bounds);
                    if (seeds.length === 0) {
                        seeds = [{
                            x: (bounds.minX + bounds.maxX) / 2,
                            y: (bounds.minY + bounds.maxY) / 2
                        }];
                    }
                    
                    const puntos = [];
                    seeds.forEach(seed => {
                        const resultadoNewton = this.newtonInterseccion(fig1, params1, fig2, params2, seed, bounds);
                        if (resultadoNewton.converge) {
                            puntos.push({ x: resultadoNewton.x, y: resultadoNewton.y });
                        }
                    });
                    
                    const puntosUnicos = this.deduplicarPuntos(puntos);
                    const puntosValidos = this.filtrarPuntosValidos(fig1, params1, fig2, params2, puntosUnicos);
                    
                    if (puntosValidos.length === 0) {
                        return { estado: 'sinInterseccion', puntos: [] };
                    }
                    
                    return { estado: 'intersecciones', puntos: puntosValidos };
                },
                
                obtenerBoundsFigura: function(fig, params) {
                    const margen = 1;
                    switch (fig.tipo) {
                        case 'circulo':
                            return {
                                minX: params.h - params.r - margen,
                                maxX: params.h + params.r + margen,
                                minY: params.k - params.r - margen,
                                maxY: params.k + params.r + margen
                            };
                        case 'parabola': {
                            const base = 6 + Math.abs(params.a) * 6;
                            if (params.tipo === 'vertical') {
                                return {
                                    minX: params.h - base,
                                    maxX: params.h + base,
                                    minY: params.k - base,
                                    maxY: params.k + base
                                };
                            }
                            return {
                                minX: params.h - base,
                                maxX: params.h + base,
                                minY: params.k - base,
                                maxY: params.k + base
                            };
                        }
                        case 'elipse':
                            return {
                                minX: params.h - params.a - margen,
                                maxX: params.h + params.a + margen,
                                minY: params.k - params.b - margen,
                                maxY: params.k + params.b + margen
                            };
                        case 'hiperbola': {
                            const range = 6 + Math.max(params.a, params.b) * 5;
                            return {
                                minX: params.h - range,
                                maxX: params.h + range,
                                minY: params.k - range,
                                maxY: params.k + range
                            };
                        }
                        default:
                            return { minX: -10, maxX: 10, minY: -10, maxY: 10 };
                    }
                },
                
                combinarBounds: function(bounds1, bounds2) {
                    const fallback = 12;
                    let minX = Math.max(bounds1.minX ?? -fallback, bounds2.minX ?? -fallback);
                    let maxX = Math.min(bounds1.maxX ?? fallback, bounds2.maxX ?? fallback);
                    let minY = Math.max(bounds1.minY ?? -fallback, bounds2.minY ?? -fallback);
                    let maxY = Math.min(bounds1.maxY ?? fallback, bounds2.maxY ?? fallback);
                    
                    if (minX >= maxX) {
                        const center = ((bounds1.minX ?? 0) + (bounds1.maxX ?? 0) + (bounds2.minX ?? 0) + (bounds2.maxX ?? 0)) / 4;
                        minX = center - fallback;
                        maxX = center + fallback;
                    }
                    
                    if (minY >= maxY) {
                        const centerY = ((bounds1.minY ?? 0) + (bounds1.maxY ?? 0) + (bounds2.minY ?? 0) + (bounds2.maxY ?? 0)) / 4;
                        minY = centerY - fallback;
                        maxY = centerY + fallback;
                    }
                    
                    return { minX, maxX, minY, maxY };
                },
                
                generarSemillas: function(fig1, params1, fig2, params2, bounds) {
                    const seeds = [];
                    const steps = 32;
                    const tol = 0.25;
                    const stepX = (bounds.maxX - bounds.minX) / steps;
                    const stepY = (bounds.maxY - bounds.minY) / steps;
                    
                    for (let i = 0; i <= steps; i++) {
                        const x = bounds.minX + stepX * i;
                        let prevF1 = null;
                        let prevF2 = null;
                        let prevY = null;
                        for (let j = 0; j <= steps; j++) {
                            const y = bounds.minY + stepY * j;
                            const f1 = this.evaluarFiguraConica(fig1.tipo, params1, x, y);
                            const f2 = this.evaluarFiguraConica(fig2.tipo, params2, x, y);
                            
                            if (!Number.isFinite(f1) || !Number.isFinite(f2)) {
                                prevF1 = f1;
                                prevF2 = f2;
                                prevY = y;
                                continue;
                            }
                            
                            if (Math.abs(f1) < tol && Math.abs(f2) < tol) {
                                seeds.push({ x, y });
                            } else {
                                if (prevF1 !== null && prevF1 * f1 < 0 && (Math.abs(f2) < tol || (prevF2 !== null && prevF2 * f2 < 0))) {
                                    seeds.push({ x: x - stepX / 2, y });
                                }
                                if (prevF2 !== null && prevF2 * f2 < 0 && (Math.abs(f1) < tol || (prevF1 !== null && prevF1 * f1 < 0))) {
                                    seeds.push({ x, y: y - stepY / 2 });
                                }
                                if (prevY !== null && Math.abs(f1) < tol && Math.abs(f2) < tol) {
                                    seeds.push({ x, y: (y + prevY) / 2 });
                                }
                            }
                            
                            prevF1 = f1;
                            prevF2 = f2;
                            prevY = y;
                        }
                    }
                    
                    const paramSeeds1 = this.generarSemillasCurva(fig1, params1, fig2, params2, bounds, tol);
                    const paramSeeds2 = this.generarSemillasCurva(fig2, params2, fig1, params1, bounds, tol);
                    seeds.push(...paramSeeds1, ...paramSeeds2);
                    
                    return this.deduplicarSemillas(seeds);
                },
                
                generarSemillasCurva: function(figBase, paramsBase, figTarget, paramsTarget, bounds, tol = 0.25) {
                    const seeds = [];
                    const pushSeed = (x, y) => {
                        if (!Number.isFinite(x) || !Number.isFinite(y)) return;
                        if (x < bounds.minX - 2 || x > bounds.maxX + 2) return;
                        if (y < bounds.minY - 2 || y > bounds.maxY + 2) return;
                        seeds.push({ x, y });
                    };
                    
                    const evaluar = (x, y) => this.evaluarFiguraConica(figTarget.tipo, paramsTarget, x, y);
                    const registrarMuestra = (pAnterior, vAnterior, x, y, valor) => {
                        if (Math.abs(valor) < tol) {
                            pushSeed(x, y);
                        }
                        if (pAnterior && Number.isFinite(vAnterior) && Number.isFinite(valor) && vAnterior * valor < 0) {
                            pushSeed((pAnterior.x + x) / 2, (pAnterior.y + y) / 2);
                        }
                        return { punto: { x, y }, valor };
                    };
                    
                    switch (figBase.tipo) {
                        case 'circulo': {
                            const muestras = 144;
                            let previo = null;
                            for (let i = 0; i <= muestras; i++) {
                                const angle = (2 * Math.PI * i) / muestras;
                                const x = paramsBase.h + paramsBase.r * Math.cos(angle);
                                const y = paramsBase.k + paramsBase.r * Math.sin(angle);
                                const valor = evaluar(x, y);
                                previo = registrarMuestra(previo && previo.punto, previo && previo.valor, x, y, valor);
                            }
                            break;
                        }
                        case 'parabola': {
                            const muestras = 160;
                            if (paramsBase.tipo === 'vertical') {
                                const rango = Math.max(6, Math.abs(paramsBase.a) * 6);
                                const minX = Math.max(bounds.minX - 1, paramsBase.h - rango);
                                const maxX = Math.min(bounds.maxX + 1, paramsBase.h + rango);
                                const paso = (maxX - minX) / muestras;
                                let previo = null;
                                for (let i = 0; i <= muestras; i++) {
                                    const x = minX + paso * i;
                                    const y = paramsBase.a * Math.pow(x - paramsBase.h, 2) + paramsBase.k;
                                    const valor = evaluar(x, y);
                                    previo = registrarMuestra(previo && previo.punto, previo && previo.valor, x, y, valor);
                                }
                            } else {
                                const rango = Math.max(6, Math.abs(paramsBase.a) * 6);
                                const minY = Math.max(bounds.minY - 1, paramsBase.k - rango);
                                const maxY = Math.min(bounds.maxY + 1, paramsBase.k + rango);
                                const paso = (maxY - minY) / muestras;
                                let previo = null;
                                for (let i = 0; i <= muestras; i++) {
                                    const y = minY + paso * i;
                                    const x = paramsBase.a * Math.pow(y - paramsBase.k, 2) + paramsBase.h;
                                    const valor = evaluar(x, y);
                                    previo = registrarMuestra(previo && previo.punto, previo && previo.valor, x, y, valor);
                                }
                            }
                            break;
                        }
                        case 'elipse': {
                            const muestras = 180;
                            let previo = null;
                            for (let i = 0; i <= muestras; i++) {
                                const angle = (2 * Math.PI * i) / muestras;
                                let x, y;
                                if (paramsBase.orientacion === 'vertical') {
                                    x = paramsBase.h + paramsBase.b * Math.cos(angle);
                                    y = paramsBase.k + paramsBase.a * Math.sin(angle);
                                } else {
                                    x = paramsBase.h + paramsBase.a * Math.cos(angle);
                                    y = paramsBase.k + paramsBase.b * Math.sin(angle);
                                }
                                const valor = evaluar(x, y);
                                previo = registrarMuestra(previo && previo.punto, previo && previo.valor, x, y, valor);
                            }
                            break;
                        }
                        case 'hiperbola': {
                            const muestras = 160;
                            const tMax = 2.5;
                            const paso = (2 * tMax) / muestras;
                            const generar = (x, y, previo) => registrarMuestra(previo && previo.punto, previo && previo.valor, x, y, evaluar(x, y));
                            if (paramsBase.orientacion === 'vertical') {
                                let previoSuperior = null;
                                let previoInferior = null;
                                for (let i = 0; i <= muestras; i++) {
                                    const t = -tMax + paso * i;
                                    const ySup = paramsBase.k + paramsBase.a * Math.cosh(t);
                                    const xSup = paramsBase.h + paramsBase.b * Math.sinh(t);
                                    previoSuperior = generar(xSup, ySup, previoSuperior);
                                    
                                    const yInf = paramsBase.k - paramsBase.a * Math.cosh(t);
                                    const xInf = paramsBase.h + paramsBase.b * Math.sinh(t);
                                    previoInferior = generar(xInf, yInf, previoInferior);
                                }
                            } else {
                                let previoDerecha = null;
                                let previoIzquierda = null;
                                for (let i = 0; i <= muestras; i++) {
                                    const t = -tMax + paso * i;
                                    const xDer = paramsBase.h + paramsBase.a * Math.cosh(t);
                                    const yDer = paramsBase.k + paramsBase.b * Math.sinh(t);
                                    previoDerecha = generar(xDer, yDer, previoDerecha);
                                    
                                    const xIzq = paramsBase.h - paramsBase.a * Math.cosh(t);
                                    const yIzq = paramsBase.k + paramsBase.b * Math.sinh(t);
                                    previoIzquierda = generar(xIzq, yIzq, previoIzquierda);
                                }
                            }
                            break;
                        }
                        default:
                            break;
                    }
                    
                    return seeds;
                },
                
                deduplicarSemillas: function(seeds, tolerancia = 0.25) {
                    const resultado = [];
                    seeds.forEach(seed => {
                        if (!seed || !Number.isFinite(seed.x) || !Number.isFinite(seed.y)) return;
                        const existe = resultado.some(p => Math.abs(p.x - seed.x) < tolerancia && Math.abs(p.y - seed.y) < tolerancia);
                        if (!existe) {
                            resultado.push(seed);
                        }
                    });
                    return resultado;
                },
                
                newtonInterseccion: function(fig1, params1, fig2, params2, seed, bounds) {
                    let x = seed.x;
                    let y = seed.y;
                    const maxIter = 30;
                    const tol = 1e-5;
                    
                    for (let iter = 0; iter < maxIter; iter++) {
                        const f1 = this.evaluarFiguraConica(fig1.tipo, params1, x, y);
                        const f2 = this.evaluarFiguraConica(fig2.tipo, params2, x, y);
                        
                        if (Math.abs(f1) < tol && Math.abs(f2) < tol) {
                            return { converge: true, x, y };
                        }
                        
                        const g1 = this.gradienteFiguraConica(fig1.tipo, params1, x, y);
                        const g2 = this.gradienteFiguraConica(fig2.tipo, params2, x, y);
                        
                        const det = g1.dx * g2.dy - g1.dy * g2.dx;
                        if (Math.abs(det) < 1e-9) {
                            break;
                        }
                        
                        const deltaX = (f1 * g2.dy - f2 * g1.dy) / det;
                        const deltaY = (g1.dx * f2 - g2.dx * f1) / det;
                        
                        x -= deltaX;
                        y -= deltaY;
                        
                        if (!Number.isFinite(x) || !Number.isFinite(y)) {
                            break;
                        }
                        
                        if (x < bounds.minX - 2 || x > bounds.maxX + 2 || y < bounds.minY - 2 || y > bounds.maxY + 2) {
                            break;
                        }
                    }
                    
                    const f1Final = this.evaluarFiguraConica(fig1.tipo, params1, x, y);
                    const f2Final = this.evaluarFiguraConica(fig2.tipo, params2, x, y);
                    
                    if (Math.abs(f1Final) < tol && Math.abs(f2Final) < tol) {
                        return { converge: true, x, y };
                    }
                    
                    return { converge: false };
                },
                
                evaluarFiguraConica: function(tipo, params, x, y) {
                    switch (tipo) {
                        case 'circulo':
                            return Math.pow(x - params.h, 2) + Math.pow(y - params.k, 2) - Math.pow(params.r, 2);
                        case 'parabola':
                            if (params.tipo === 'vertical') {
                                return y - (params.a * Math.pow(x - params.h, 2) + params.k);
                            }
                            return x - (params.a * Math.pow(y - params.k, 2) + params.h);
                        case 'elipse':
                            return Math.pow(x - params.h, 2) / Math.pow(params.a, 2) + Math.pow(y - params.k, 2) / Math.pow(params.b, 2) - 1;
                        case 'hiperbola':
                            if (params.orientacion === 'vertical') {
                                return Math.pow(y - params.k, 2) / Math.pow(params.a, 2) - Math.pow(x - params.h, 2) / Math.pow(params.b, 2) - 1;
                            }
                            return Math.pow(x - params.h, 2) / Math.pow(params.a, 2) - Math.pow(y - params.k, 2) / Math.pow(params.b, 2) - 1;
                        default:
                            return 0;
                    }
                },
                
                gradienteFiguraConica: function(tipo, params, x, y) {
                    switch (tipo) {
                        case 'circulo':
                            return { dx: 2 * (x - params.h), dy: 2 * (y - params.k) };
                        case 'parabola':
                            if (params.tipo === 'vertical') {
                                return { dx: -2 * params.a * (x - params.h), dy: 1 };
                            }
                            return { dx: 1, dy: -2 * params.a * (y - params.k) };
                        case 'elipse':
                            return {
                                dx: 2 * (x - params.h) / Math.pow(params.a, 2),
                                dy: 2 * (y - params.k) / Math.pow(params.b, 2)
                            };
                        case 'hiperbola':
                            if (params.orientacion === 'vertical') {
                                return {
                                    dx: -2 * (x - params.h) / Math.pow(params.b, 2),
                                    dy: 2 * (y - params.k) / Math.pow(params.a, 2)
                                };
                            }
                            return {
                                dx: 2 * (x - params.h) / Math.pow(params.a, 2),
                                dy: -2 * (y - params.k) / Math.pow(params.b, 2)
                            };
                        default:
                            return { dx: 0, dy: 0 };
                    }
                },
                
                deduplicarPuntos: function(puntos, tolerancia = 0.05) {
                    const resultado = [];
                    puntos.forEach(p => {
                        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
                        const existe = resultado.some(q => Math.abs(q.x - p.x) < tolerancia && Math.abs(q.y - p.y) < tolerancia);
                        if (!existe) {
                            resultado.push(p);
                        }
                    });
                    return resultado;
                },
                
                filtrarPuntosValidos: function(fig1, params1, fig2, params2, puntos, tolerancia = 1e-3) {
                    return this.deduplicarPuntos(
                        puntos.filter(p => {
                            const f1 = this.evaluarFiguraConica(fig1.tipo, params1, p.x, p.y);
                            const f2 = this.evaluarFiguraConica(fig2.tipo, params2, p.x, p.y);
                            return Number.isFinite(f1) && Number.isFinite(f2) && Math.abs(f1) < tolerancia && Math.abs(f2) < tolerancia;
                        })
                    );
                },
                
                dibujarRecta: function(A, B, C, color = '#ff6600', lineWidth = 2) {
                    const ctx = this.ctx;
                    const width = this.canvas.width;
                    const height = this.canvas.height;
                    const centerX = width / 2;
                    const centerY = height / 2;
                    const escala = this.escala;
                    
                    ctx.strokeStyle = color;
                    ctx.lineWidth = lineWidth;
                    
                    // Convertir de la forma Ax + By + C = 0 a la forma y = mx + b
                    // Si B es 0, es una línea vertical
                    if (B === 0) {
                        if (A === 0) return; // No es una línea válida
                        
                        // Línea vertical x = -C/A
                        const x = -C / A;
                        const pxX = centerX + x * escala;
                        
                        ctx.beginPath();
                        ctx.moveTo(pxX, 0);
                        ctx.lineTo(pxX, height);
                        ctx.stroke();
                    } else {
                        // Línea de la forma y = (-A/B)x - C/B
                        const m = -A / B;
                        const b = -C / B;
                        
                        // Calcular dos puntos para dibujar la línea
                        const x1 = -width / (2 * escala);
                        const y1 = m * x1 + b;
                        const x2 = width / (2 * escala);
                        const y2 = m * x2 + b;
                        
                        // Convertir a coordenadas de píxeles
                        const pxX1 = centerX + x1 * escala;
                        const pxY1 = centerY - y1 * escala;
                        const pxX2 = centerX + x2 * escala;
                        const pxY2 = centerY - y2 * escala;
                        
                        ctx.beginPath();
                        ctx.moveTo(pxX1, pxY1);
                        ctx.lineTo(pxX2, pxY2);
                        ctx.stroke();
                    }
                },
                
                dibujarCirculo: function(options = {}) {
                    const prefix = options.prefix || 'circulo';
                    const color = options.color || '#0066cc';
                    const hInput = document.getElementById(`${prefix}CentroH`);
                    const kInput = document.getElementById(`${prefix}CentroK`);
                    const rInput = document.getElementById(`${prefix}Radio`);
                    if (!hInput || !kInput || !rInput) return;
                    
                    const h = parseFloat(hInput.value);
                    const k = parseFloat(kInput.value);
                    const r = Math.max(0.1, parseFloat(rInput.value));
                    
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    const escala = this.escala;
                    
                    const pxH = centerX + h * escala;
                    const pxK = centerY - k * escala;
                    const pxR = r * escala;
                    
                    const ctx = this.ctx;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    
                    ctx.beginPath();
                    ctx.arc(pxH, pxK, pxR, 0, 2 * Math.PI);
                    ctx.stroke();
                },
                
                dibujarParabola: function(options = {}) {
                    const prefix = options.prefix || 'parabola';
                    const color = options.color || '#009933';
                    const hInput = document.getElementById(`${prefix}H`);
                    const kInput = document.getElementById(`${prefix}K`);
                    const aInput = document.getElementById(`${prefix}A`);
                    const tipoSelect = document.getElementById(`${prefix}Tipo`);
                    
                    if (!hInput || !kInput || !aInput || !tipoSelect) return;
                    
                    const h = parseFloat(hInput.value);
                    const k = parseFloat(kInput.value);
                    const a = parseFloat(aInput.value);
                    const tipo = tipoSelect.value || 'vertical';
                    
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    const escala = this.escala;
                    const width = this.canvas.width;
                    
                    const ctx = this.ctx;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    
                    ctx.beginPath();
                    
                    if (tipo === 'vertical') {
                        // Parábola vertical: y = a(x-h)² + k
                        for (let pxX = 0; pxX < width; pxX++) {
                            const x = (pxX - centerX) / escala;
                            const y = a * Math.pow(x - h, 2) + k;
                            const pxY = centerY - y * escala;
                            
                            if (pxX === 0) {
                                ctx.moveTo(pxX, pxY);
                            } else {
                                ctx.lineTo(pxX, pxY);
                            }
                        }
                    } else {
                        // Parábola horizontal: x = a(y-k)² + h
                        for (let pxY = 0; pxY < this.canvas.height; pxY++) {
                            const y = (centerY - pxY) / escala;
                            const x = a * Math.pow(y - k, 2) + h;
                            const pxX = centerX + x * escala;
                            
                            if (pxY === 0) {
                                ctx.moveTo(pxX, pxY);
                            } else {
                                ctx.lineTo(pxX, pxY);
                            }
                        }
                    }
                    
                    ctx.stroke();
                },
                
                dibujarSegundaRecta: function() {
                    let A, B, C;
                    
                    const forma = document.getElementById('recta2Forma').value;
                    if (forma === 'general') {
                        A = parseFloat(document.getElementById('recta2A').value);
                        B = parseFloat(document.getElementById('recta2B').value);
                        C = parseFloat(document.getElementById('recta2C').value);
                    } else {
                        const m = parseFloat(document.getElementById('recta2M').value);
                        const b = parseFloat(document.getElementById('recta2B2').value);
                        A = m;
                        B = -1;
                        C = b;
                    }
                    
                    this.dibujarRecta(A, B, C, '#00cc99', 2);
                },
                
                dibujarElipse: function(options = {}) {
                    const prefix = options.prefix || 'elipse';
                    const color = options.color || '#9900cc';
                    const hInput = document.getElementById(`${prefix}CentroH`);
                    const kInput = document.getElementById(`${prefix}CentroK`);
                    const aInput = document.getElementById(`${prefix}A`);
                    const bInput = document.getElementById(`${prefix}B`);
                    const orientacionSelect = document.getElementById(`${prefix}Orientacion`);
                    
                    if (!hInput || !kInput || !aInput || !bInput || !orientacionSelect) return;
                    
                    const h = parseFloat(hInput.value);
                    const k = parseFloat(kInput.value);
                    const a = Math.max(0.1, parseFloat(aInput.value));
                    const b = Math.max(0.1, parseFloat(bInput.value));
                    const orientacion = orientacionSelect.value || 'horizontal';
                    
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    const escala = this.escala;
                    
                    const pxH = centerX + h * escala;
                    const pxK = centerY - k * escala;
                    const pxA = a * escala;
                    const pxB = b * escala;
                    
                    const ctx = this.ctx;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    
                    ctx.beginPath();
                    
                    for (let angle = 0; angle <= Math.PI * 2; angle += 0.01) {
                        let x, y;
                        
                        if (orientacion === 'horizontal') {
                            x = h + a * Math.cos(angle);
                            y = k + b * Math.sin(angle);
                        } else { // vertical
                            x = h + b * Math.cos(angle);
                            y = k + a * Math.sin(angle);
                        }
                        
                        const pxX = centerX + x * escala;
                        const pxY = centerY - y * escala;
                        
                        if (angle === 0) {
                            ctx.moveTo(pxX, pxY);
                        } else {
                            ctx.lineTo(pxX, pxY);
                        }
                    }
                    
                    ctx.closePath();
                    ctx.stroke();
                },
                
                dibujarHiperbola: function(options = {}) {
                    const prefix = options.prefix || 'hiperbola';
                    const color = options.color || '#cc6600';
                    const hInput = document.getElementById(`${prefix}CentroH`);
                    const kInput = document.getElementById(`${prefix}CentroK`);
                    const aInput = document.getElementById(`${prefix}A`);
                    const bInput = document.getElementById(`${prefix}B`);
                    const orientacionSelect = document.getElementById(`${prefix}Orientacion`);
                    
                    if (!hInput || !kInput || !aInput || !bInput || !orientacionSelect) return;
                    
                    const h = parseFloat(hInput.value);
                    const k = parseFloat(kInput.value);
                    const a = Math.max(0.1, parseFloat(aInput.value));
                    const b = Math.max(0.1, parseFloat(bInput.value));
                    const orientacion = orientacionSelect.value || 'horizontal';
                    
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    const escala = this.escala;
                    const width = this.canvas.width;
                    const height = this.canvas.height;
                    
                    const ctx = this.ctx;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    
                    if (orientacion === 'horizontal') {
                        // Rama derecha
                        ctx.beginPath();
                        for (let t = -1.5; t <= 1.5; t += 0.01) {
                            const x = h + a * Math.cosh(t);
                            const y = k + b * Math.sinh(t);
                            const pxX = centerX + x * escala;
                            const pxY = centerY - y * escala;
                            
                            if (t === -1.5) {
                                ctx.moveTo(pxX, pxY);
                            } else {
                                ctx.lineTo(pxX, pxY);
                            }
                        }
                        ctx.stroke();
                        
                        // Rama izquierda
                        ctx.beginPath();
                        for (let t = -1.5; t <= 1.5; t += 0.01) {
                            const x = h - a * Math.cosh(t);
                            const y = k - b * Math.sinh(t);
                            const pxX = centerX + x * escala;
                            const pxY = centerY - y * escala;
                            
                            if (t === -1.5) {
                                ctx.moveTo(pxX, pxY);
                            } else {
                                ctx.lineTo(pxX, pxY);
                            }
                        }
                        ctx.stroke();
                    } else { // vertical
                        // Rama superior
                        ctx.beginPath();
                        for (let t = -1.5; t <= 1.5; t += 0.01) {
                            const x = h + b * Math.sinh(t);
                            const y = k + a * Math.cosh(t);
                            const pxX = centerX + x * escala;
                            const pxY = centerY - y * escala;
                            
                            if (t === -1.5) {
                                ctx.moveTo(pxX, pxY);
                            } else {
                                ctx.lineTo(pxX, pxY);
                            }
                        }
                        ctx.stroke();
                        
                        // Rama inferior
                        ctx.beginPath();
                        for (let t = -1.5; t <= 1.5; t += 0.01) {
                            const x = h - b * Math.sinh(t);
                            const y = k - a * Math.cosh(t);
                            const pxX = centerX + x * escala;
                            const pxY = centerY - y * escala;
                            
                            if (t === -1.5) {
                                ctx.moveTo(pxX, pxY);
                            } else {
                                ctx.lineTo(pxX, pxY);
                            }
                        }
                        ctx.stroke();
                    }
                    
                    // Dibujar asíntotas
                    ctx.strokeStyle = '#cc6600';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([5, 5]);
                    
                    if (orientacion === 'horizontal') {
                        const pendiente1 = b / a;
                        const pendiente2 = -b / a;
                        
                        // Asíntota 1: y = (b/a)(x-h) + k
                        const x1 = -width / (2 * escala);
                        const y1 = pendiente1 * (x1 - h) + k;
                        const x2 = width / (2 * escala);
                        const y2 = pendiente1 * (x2 - h) + k;
                        
                        ctx.beginPath();
                        ctx.moveTo(centerX + x1 * escala, centerY - y1 * escala);
                        ctx.lineTo(centerX + x2 * escala, centerY - y2 * escala);
                        ctx.stroke();
                        
                        // Asíntota 2: y = -(b/a)(x-h) + k
                        const y3 = pendiente2 * (x1 - h) + k;
                        const y4 = pendiente2 * (x2 - h) + k;
                        
                        ctx.beginPath();
                        ctx.moveTo(centerX + x1 * escala, centerY - y3 * escala);
                        ctx.lineTo(centerX + x2 * escala, centerY - y4 * escala);
                        ctx.stroke();
                    } else { // vertical
                        const pendiente1 = a / b;
                        const pendiente2 = -a / b;
                        
                        // Asíntota 1: x = (a/b)(y-k) + h
                        const y1 = -height / (2 * escala);
                        const x1 = pendiente1 * (y1 - k) + h;
                        const y2 = height / (2 * escala);
                        const x2 = pendiente1 * (y2 - k) + h;
                        
                        ctx.beginPath();
                        ctx.moveTo(centerX + x1 * escala, centerY - y1 * escala);
                        ctx.lineTo(centerX + x2 * escala, centerY - y2 * escala);
                        ctx.stroke();
                        
                        // Asíntota 2: x = -(a/b)(y-k) + h
                        const x3 = pendiente2 * (y1 - k) + h;
                        const x4 = pendiente2 * (y2 - k) + h;
                        
                        ctx.beginPath();
                        ctx.moveTo(centerX + x3 * escala, centerY - y1 * escala);
                        ctx.lineTo(centerX + x4 * escala, centerY - y2 * escala);
                        ctx.stroke();
                    }
                    
                    ctx.setLineDash([]);
                },
                
                calcularSolucion: function() {
                    const resultadoDiv = document.getElementById('solucionAlgebraica');
                    const ecuacionesDiv = document.getElementById('ecuacionesResultado');
                    const coordenadasDiv = document.getElementById('coordenadasInterseccion');
                    const detallesDebugDiv = document.getElementById('detallesInterseccionDebug');
                    const conicConfig = this.conicSystems[this.tipoActual];
                    
                    if (conicConfig) {
                        const paramsFigura1 = this.obtenerParametrosFigura(conicConfig.figura1);
                        const paramsFigura2 = this.obtenerParametrosFigura(conicConfig.figura2);
                        
                        if (!paramsFigura1 || !paramsFigura2) {
                            resultadoDiv.innerHTML = '<h5>Solución Algebraica:</h5><p>Complete los parámetros de ambas figuras para calcular la intersección.</p>';
                        ecuacionesDiv.innerHTML = '';
                        this.actualizarListadoIntersecciones(coordenadasDiv, []);
                        this.dibujarIntersecciones([]);
                        if (detallesDebugDiv) detallesDebugDiv.innerHTML = '';
                        return;
                    }
                    
                    const resultado = this.resolverSistemaConicas(conicConfig, paramsFigura1, paramsFigura2);
                    
                        resultadoDiv.innerHTML = `<h5>Solución Algebraica:</h5>${resultado.mensaje}`;
                        ecuacionesDiv.innerHTML = `
                            <h5>Ecuaciones:</h5>
                            <p>Figura 1: ${resultado.ecuacion1}</p>
                            <p>Figura 2: ${resultado.ecuacion2}</p>
                        `;
                        
                        this.actualizarListadoIntersecciones(coordenadasDiv, resultado.intersecciones);
                        this.dibujarIntersecciones(resultado.intersecciones);
                        
                        
                        return;
                    }
                    
                    const rectaParams = this.obtenerParametrosRecta();
                    if (!rectaParams) {
                        resultadoDiv.innerHTML = '<h5>Solución Algebraica:</h5><p>No se encontraron parámetros válidos para la recta.</p>';
                        ecuacionesDiv.innerHTML = '';
                        this.actualizarListadoIntersecciones(coordenadasDiv, []);
                        this.dibujarIntersecciones([]);
                        return;
                    }
                    const A = rectaParams.A;
                    const B = rectaParams.B;
                    const C = rectaParams.C;
                    
                    let solucion = '<h5>Solución Algebraica:</h5>';
                    let ecuacionRecta;
                    
                    if (B !== 0) {
                        // Forma y = mx + b
                        const m = -A / B;
                        const b = -C / B;
                        ecuacionRecta = `y = ${m.toFixed(2)}x + ${b.toFixed(2)}`;
                    } else if (A !== 0) {
                        // Forma x = constante
                        const x0 = -C / A;
                        ecuacionRecta = `x = ${x0.toFixed(2)}`;
                    } else {
                        ecuacionRecta = "Ecuación no válida";
                    }
                    
                    let intersecciones = [];
                    let ecuacionSecundaria = '';
                    
                    // Cálculo de intersecciones según el tipo de sistema
                    switch (this.tipoActual) {
                        case 'rectaCirculo':
                            const h = parseFloat(document.getElementById('circuloCentroH').value);
                            const k = parseFloat(document.getElementById('circuloCentroK').value);
                            const r = parseFloat(document.getElementById('circuloRadio').value);
                            
                            ecuacionSecundaria = `(x - ${h})² + (y - ${k})² = ${r}²`;
                            
                            // La solución depende de si la recta está en forma normal o no
                            if (B !== 0) {
                                const m = -A / B;
                                const b = -C / B;
                                
                                // Sustituir y = mx + b en la ecuación del círculo
                                // (x - h)² + (mx + b - k)² = r²
                                const A_quad = 1 + m * m;
                                const B_quad = 2 * m * (b - k) - 2 * h;
                                const C_quad = h * h + (b - k) * (b - k) - r * r;
                                
                                const discriminante = B_quad * B_quad - 4 * A_quad * C_quad;
                                
                                if (discriminante < 0) {
                                    solucion += "No hay intersección entre la recta y el círculo.";
                                } else if (discriminante === 0) {
                                    const x = -B_quad / (2 * A_quad);
                                    const y = m * x + b;
                                    intersecciones = [{ x, y }];
                                    solucion += "La recta es tangente al círculo en un punto.";
                                } else {
                                    const x1 = (-B_quad + Math.sqrt(discriminante)) / (2 * A_quad);
                                    const y1 = m * x1 + b;
                                    const x2 = (-B_quad - Math.sqrt(discriminante)) / (2 * A_quad);
                                    const y2 = m * x2 + b;
                                    intersecciones = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
                                    solucion += "La recta corta al círculo en dos puntos.";
                                }
                            } else if (A !== 0) {
                                // Caso x = constante
                                const x0 = -C / A;
                                const A_quad = 1;
                                const B_quad = -2 * k;
                                const C_quad = k * k + (x0 - h) * (x0 - h) - r * r;
                                
                                const discriminante = B_quad * B_quad - 4 * A_quad * C_quad;
                                
                                if (discriminante < 0) {
                                    solucion += "No hay intersección entre la recta vertical y el círculo.";
                                } else if (discriminante === 0) {
                                    const y = -B_quad / (2 * A_quad);
                                    intersecciones = [{ x: x0, y }];
                                    solucion += "La recta vertical es tangente al círculo en un punto.";
                                } else {
                                    const y1 = (-B_quad + Math.sqrt(discriminante)) / (2 * A_quad);
                                    const y2 = (-B_quad - Math.sqrt(discriminante)) / (2 * A_quad);
                                    intersecciones = [{ x: x0, y: y1 }, { x: x0, y: y2 }];
                                    solucion += "La recta vertical corta al círculo en dos puntos.";
                                }
                            }
                            break;
                        
                        case 'rectaRecta':
                            let A2, B2, C2;
                            const forma2 = document.getElementById('recta2Forma').value;
                            
                            if (forma2 === 'general') {
                                A2 = parseFloat(document.getElementById('recta2A').value);
                                B2 = parseFloat(document.getElementById('recta2B').value);
                                C2 = parseFloat(document.getElementById('recta2C').value);
                            } else {
                                const m = parseFloat(document.getElementById('recta2M').value);
                                const b = parseFloat(document.getElementById('recta2B2').value);
                                A2 = m;
                                B2 = -1;
                                C2 = b;
                            }
                            
                            if (B2 !== 0) {
                                const m2 = -A2 / B2;
                                const b2 = -C2 / B2;
                                ecuacionSecundaria = `y = ${m2.toFixed(2)}x + ${b2.toFixed(2)}`;
                            } else if (A2 !== 0) {
                                const x0 = -C2 / A2;
                                ecuacionSecundaria = `x = ${x0.toFixed(2)}`;
                            } else {
                                ecuacionSecundaria = "Ecuación no válida";
                            }
                            
                            // Resolver sistema de ecuaciones
                            const det = A * B2 - A2 * B;
                            
                            if (det === 0) {
                                solucion += "Las rectas son paralelas o coincidentes.";
                                
                                // Verificar si son coincidentes
                                const k1 = A !== 0 ? -C / A : (B !== 0 ? -C / B : 0);
                                const k2 = A2 !== 0 ? -C2 / A2 : (B2 !== 0 ? -C2 / B2 : 0);
                                
                                if (Math.abs(k1 - k2) < 0.0001) {
                                    solucion += " De hecho, son la misma recta (coincidentes).";
                                }
                            } else {
                                const x = (B * C2 - B2 * C) / det;
                                const y = (A2 * C - A * C2) / det;
                                intersecciones = [{ x, y }];
                                solucion += "Las rectas se intersectan en un punto.";
                            }
                            break;
                        
                        case 'rectaParabola':
                            const ph = parseFloat(document.getElementById('parabolaH').value);
                            const pk = parseFloat(document.getElementById('parabolaK').value);
                            const pa = parseFloat(document.getElementById('parabolaA').value);
                            const tipoParabola = document.getElementById('parabolaTipo').value;
                            
                            if (tipoParabola === 'vertical') {
                                ecuacionSecundaria = `y = ${pa}(x - ${ph})² + ${pk}`;
                                
                                if (B !== 0) {
                                    const m = -A / B;
                                    const b = -C / B;
                                    
                                    // Sustituir y = mx + b en la ecuación de la parábola
                                    // mx + b = a(x - h)² + k
                                    // Simplificando: a*x² - 2*a*h*x + a*h² + k - mx - b = 0
                                    const A_quad = pa;
                                    const B_quad = -2 * pa * ph - m;
                                    const C_quad = pa * ph * ph + pk - b;
                                    
                                    const discriminante = B_quad * B_quad - 4 * A_quad * C_quad;
                                    
                                    if (discriminante < 0) {
                                        solucion += "No hay intersección entre la recta y la parábola.";
                                    } else if (discriminante === 0) {
                                        const x = -B_quad / (2 * A_quad);
                                        const y = m * x + b;
                                        intersecciones = [{ x, y }];
                                        solucion += "La recta es tangente a la parábola en un punto.";
                                    } else {
                                        const x1 = (-B_quad + Math.sqrt(discriminante)) / (2 * A_quad);
                                        const y1 = m * x1 + b;
                                        const x2 = (-B_quad - Math.sqrt(discriminante)) / (2 * A_quad);
                                        const y2 = m * x2 + b;
                                        intersecciones = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
                                        solucion += "La recta corta a la parábola en dos puntos.";
                                    }
                                } else if (A !== 0) {
                                    const x0 = -C / A;
                                    const y = pa * Math.pow(x0 - ph, 2) + pk;
                                    intersecciones = [{ x: x0, y }];
                                    solucion += "La recta vertical corta a la parábola en un punto.";
                                }
                            } else { // Parábola horizontal
                                ecuacionSecundaria = `x = ${pa}(y - ${pk})² + ${ph}`;
                                
                                if (B !== 0) {
                                    const m = -A / B;
                                    const b = -C / B;
                                    
                                    // Sustituir y en la ecuación de la parábola
                                    // x = a(y - k)² + h = a(mx + b - k)² + h
                                    // x = a(mx + b - k)² + h
                                    // x - h = a(mx + b - k)²
                                    // x - h = a(m²x² + 2m(b-k)x + (b-k)²)
                                    // x - h = a*m²*x² + 2*a*m*(b-k)*x + a*(b-k)²
                                    // 0 = a*m²*x² + 2*a*m*(b-k)*x + a*(b-k)² - x + h
                                    // 0 = a*m²*x² + (2*a*m*(b-k) - 1)*x + a*(b-k)² + h
                                    
                                    const A_quad = pa * m * m;
                                    const B_quad = 2 * pa * m * (b - pk) - 1;
                                    const C_quad = pa * Math.pow(b - pk, 2) + ph;
                                    
                                    const discriminante = B_quad * B_quad - 4 * A_quad * C_quad;
                                    
                                    if (discriminante < 0) {
                                        solucion += "No hay intersección entre la recta y la parábola horizontal.";
                                    } else if (discriminante === 0) {
                                        const x = -B_quad / (2 * A_quad);
                                        const y = m * x + b;
                                        intersecciones = [{ x, y }];
                                        solucion += "La recta es tangente a la parábola horizontal en un punto.";
                                    } else {
                                        const x1 = (-B_quad + Math.sqrt(discriminante)) / (2 * A_quad);
                                        const y1 = m * x1 + b;
                                        const x2 = (-B_quad - Math.sqrt(discriminante)) / (2 * A_quad);
                                        const y2 = m * x2 + b;
                                        intersecciones = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
                                        solucion += "La recta corta a la parábola horizontal en dos puntos.";
                                    }
                                } else if (A !== 0) {
                                    const x0 = -C / A;
                                    
                                    // Resolver x0 = a(y - k)² + h
                                    // (x0 - h) / a = (y - k)²
                                    // y - k = ±sqrt((x0 - h) / a)
                                    // Verificar si (x0 - h) / a es positivo
                                    
                                    const radicando = (x0 - ph) / pa;
                                    
                                    if (radicando < 0) {
                                        solucion += "No hay intersección entre la recta vertical y la parábola horizontal.";
                                    } else if (radicando === 0) {
                                        const y = pk;
                                        intersecciones = [{ x: x0, y }];
                                        solucion += "La recta vertical es tangente a la parábola horizontal en un punto.";
                                    } else {
                                        const y1 = pk + Math.sqrt(radicando);
                                        const y2 = pk - Math.sqrt(radicando);
                                        intersecciones = [{ x: x0, y: y1 }, { x: x0, y: y2 }];
                                        solucion += "La recta vertical corta a la parábola horizontal en dos puntos.";
                                    }
                                }
                            }
                            break;
                        
                        // Caso básico para elipse e hipérbola (implementación simplificada)
                        case 'rectaElipse':
                        case 'rectaHiperbola':
                            solucion += "El cálculo de intersecciones para sistemas " + this.tipoActual + " requiere resolver ecuaciones de mayor grado.";
                            break;
                    }
                    
                    // Actualizar los elementos HTML
                    resultadoDiv.innerHTML = solucion;
                    
                    ecuacionesDiv.innerHTML = `
                        <h5>Ecuaciones:</h5>
                        <p>Lineal (L): ${ecuacionRecta}</p>
                        <p>No Lineal (NL): ${ecuacionSecundaria}</p>
                    `;
                    
                    // Dibujar puntos de intersección en el gráfico
                    this.dibujarIntersecciones(intersecciones);
                    
                    this.actualizarListadoIntersecciones(coordenadasDiv, intersecciones);
                    if (detallesDebugDiv) detallesDebugDiv.innerHTML = '';
                },
                
                dibujarIntersecciones: function(puntos) {
                    if (!puntos || puntos.length === 0) return;
                    
                    const centerX = this.canvas.width / 2;
                    const centerY = this.canvas.height / 2;
                    const escala = this.escala;
                    const ctx = this.ctx;
                    
                    ctx.fillStyle = '#ff0000';
                    
                    puntos.forEach((punto, i) => {
                        const pxX = centerX + punto.x * escala;
                        const pxY = centerY - punto.y * escala;
                        
                        // Dibujar punto
                        ctx.beginPath();
                        ctx.arc(pxX, pxY, 5, 0, 2 * Math.PI);
                        ctx.fill();
                        
                        // Etiquetar el punto
                        ctx.fillStyle = '#000000';
                        ctx.font = '12px Arial';
                        ctx.fillText(`P${i+1}`, pxX + 8, pxY - 8);
                        ctx.fillStyle = '#ff0000';
                    });
                }
            } // End of app.sistemaRectas
            
            ,distanciaPuntos: {
                canvas: null,
                ctx: null,
                
                init: function() {
                    this.canvas = document.getElementById('distanciaCanvas');
                    if (!this.canvas) return;
                    
                    this.ctx = this.canvas.getContext('2d');
                    
                    // Inicializar evento para los inputs
                    document.getElementById('x0').addEventListener('input', () => this.updateAll(false));
                    document.getElementById('y0').addEventListener('input', () => this.updateAll(false));
                    document.getElementById('x1').addEventListener('input', () => this.updateAll(false));
                    document.getElementById('y1').addEventListener('input', () => this.updateAll(false));
                    
                    // Eventos para los checkbox
                    document.getElementById('showHorizontal').addEventListener('change', () => this.updateAll(false));
                    document.getElementById('showVertical').addEventListener('change', () => this.updateAll(false));
                    document.getElementById('showTriangle').addEventListener('change', () => this.updateAll(false));
                    
                    const calculateButton = document.getElementById('calculateDistanceBtn');
                    if (calculateButton) {
                        calculateButton.addEventListener('click', (event) => {
                            event.preventDefault();
                            this.updateAll(true);
                        });
                    }
                    
                    // Hacer el primer dibujo
                    this.updateAll(false);
                },
                
                updateAll: function(triggeredByButton = false) {
                    console.log('[distanciaPuntos] updateAll called', { triggeredByButton });
                    const calc = this.calculateDistances();
                    console.log('[distanciaPuntos] Calculated values', calc);
                    this.drawGraph(calc);
                    this.updateTable(calc);
                    this.updateSummary(calc, triggeredByButton);
                },
                
                calculateDistances: function() {
                    const x0 = parseFloat(document.getElementById('x0').value);
                    const y0 = parseFloat(document.getElementById('y0').value);
                    const x1 = parseFloat(document.getElementById('x1').value);
                    const y1 = parseFloat(document.getElementById('y1').value);
                    
                    // Calcular catetos
                    const catetoHorizontal = Math.abs(x1 - x0);
                    const catetoVertical = Math.abs(y1 - y0);
                    
                    // Calcular hipotenusa (distancia directa)
                    const hipotenusa = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
                    
                    return {
                        x0, y0, x1, y1,
                        catetoH: catetoHorizontal,
                        catetoV: catetoVertical,
                        hipotenusa,
                        pitagoras: Math.sqrt(Math.pow(catetoHorizontal, 2) + Math.pow(catetoVertical, 2))
                    };
                },
                
                drawGraph: function(precomputedCalc) {
                    if (!this.canvas || !this.ctx) return;
                    
                    const calc = precomputedCalc || this.calculateDistances();
                    const showHorizontal = document.getElementById('showHorizontal').checked;
                    const showVertical = document.getElementById('showVertical').checked;
                    const showTriangle = document.getElementById('showTriangle').checked;
                    
                    // Determinar límites del gráfico con un margen
                    const margin = 2;
                    const xMin = Math.min(calc.x0, calc.x1) - margin;
                    const xMax = Math.max(calc.x0, calc.x1) + margin;
                    const yMin = Math.min(calc.y0, calc.y1) - margin;
                    const yMax = Math.max(calc.y0, calc.y1) + margin;
                    
                    // Configurar escala y desplazamiento para el dibujo
                    const width = this.canvas.width;
                    const height = this.canvas.height;
                    const rangeX = xMax - xMin;
                    const rangeY = yMax - yMin;
                    
                    // Escala: píxeles por unidad
                    const scaleX = width / rangeX;
                    const scaleY = height / rangeY;
                    
                    // Función para convertir coordenadas matemáticas a píxeles
                    const toCanvasX = x => (x - xMin) * scaleX;
                    const toCanvasY = y => height - (y - yMin) * scaleY;
                    
                    // Limpiar el canvas
                    this.ctx.clearRect(0, 0, width, height);
                    
                    // Dibujar grid y ejes
                    this.drawGrid(xMin, xMax, yMin, yMax, toCanvasX, toCanvasY);
                    
                    // Convertir coordenadas de los puntos a coordenadas de canvas
                    const canvasX0 = toCanvasX(calc.x0);
                    const canvasY0 = toCanvasY(calc.y0);
                    const canvasX1 = toCanvasX(calc.x1);
                    const canvasY1 = toCanvasY(calc.y1);
                    
                    // Dibujar sombreado del triángulo condicionalmente
                    if (showTriangle && showHorizontal && showVertical) {
                        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
                        this.ctx.beginPath();
                        this.ctx.moveTo(canvasX0, canvasY0);
                        this.ctx.lineTo(canvasX1, canvasY0);
                        this.ctx.lineTo(canvasX1, canvasY1);
                        this.ctx.closePath();
                        this.ctx.fill();
                    }
                    
                    // Dibujar cateto horizontal
                    if (showHorizontal) {
                        this.ctx.strokeStyle = '#3498db';
                        this.ctx.lineWidth = 3;
                        this.ctx.beginPath();
                        this.ctx.moveTo(canvasX0, canvasY0);
                        this.ctx.lineTo(canvasX1, canvasY0);
                        this.ctx.stroke();
                        
                        // Etiquetar el cateto horizontal
                        const midX = (canvasX0 + canvasX1) / 2;
                        this.ctx.fillStyle = '#3498db';
                        this.ctx.font = '14px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(calc.catetoH.toFixed(2), midX, canvasY0 + 20);
                    }
                    
                    // Dibujar cateto vertical
                    if (showVertical) {
                        this.ctx.strokeStyle = '#3498db';
                        this.ctx.lineWidth = 3;
                        this.ctx.beginPath();
                        this.ctx.moveTo(canvasX1, canvasY0);
                        this.ctx.lineTo(canvasX1, canvasY1);
                        this.ctx.stroke();
                        
                        // Etiquetar el cateto vertical
                        const midY = (canvasY0 + canvasY1) / 2;
                        this.ctx.fillStyle = '#3498db';
                        this.ctx.font = '14px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(calc.catetoV.toFixed(2), canvasX1 + 20, midY);
                    }
                    
                    // Dibujar la línea de distancia directa (siempre visible)
                    this.ctx.strokeStyle = '#e74c3c';
                    this.ctx.lineWidth = 4;
                    this.ctx.beginPath();
                    this.ctx.moveTo(canvasX0, canvasY0);
                    this.ctx.lineTo(canvasX1, canvasY1);
                    this.ctx.stroke();
                    
                    // Etiquetar la distancia directa con un fondo visible dentro del canvas
                    const midXDirect = (canvasX0 + canvasX1) / 2;
                    const midYDirect = (canvasY0 + canvasY1) / 2;
                    const labelText = `d = ${calc.hipotenusa.toFixed(2)}`;
                    this.ctx.font = '16px Arial';
                    const textMetrics = this.ctx.measureText(labelText);
                    const textWidth = textMetrics.width;
                    const textHeight = ((textMetrics.actualBoundingBoxAscent || 12) + (textMetrics.actualBoundingBoxDescent || 6));
                    const labelPadding = 12;
                    const halfWidth = textWidth / 2;
                    const halfHeight = textHeight / 2;
                    
                    let labelX = midXDirect;
                    let labelY = midYDirect;
                    
                    labelX = Math.min(Math.max(labelX, labelPadding + halfWidth), width - (labelPadding + halfWidth));
                    labelY = Math.min(Math.max(labelY, labelPadding + halfHeight), height - (labelPadding + halfHeight));
                    
                    const rectX = labelX - halfWidth - labelPadding / 2;
                    const rectY = labelY - halfHeight - labelPadding / 2;
                    const rectWidth = textWidth + labelPadding;
                    const rectHeight = textHeight + labelPadding;
                    
                    const previousLineWidth = this.ctx.lineWidth;
                    const previousTextBaseline = this.ctx.textBaseline || 'alphabetic';
                    
                    this.ctx.fillStyle = 'rgba(231, 76, 60, 0.15)';
                    this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
                    this.ctx.strokeStyle = '#e74c3c';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
                    
                    this.ctx.fillStyle = '#e74c3c';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(labelText, labelX, labelY);
                    
                    this.ctx.textBaseline = previousTextBaseline;
                    this.ctx.lineWidth = previousLineWidth;
                    
                    // Dibujar los puntos
                    // Punto P0
                    this.ctx.fillStyle = '#2c3e50';
                    this.ctx.beginPath();
                    this.ctx.arc(canvasX0, canvasY0, 6, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    // Punto P1
                    this.ctx.beginPath();
                    this.ctx.arc(canvasX1, canvasY1, 6, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    // Etiquetar los puntos
                    this.ctx.fillStyle = '#2c3e50';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(`P₀(${calc.x0}, ${calc.y0})`, canvasX0, canvasY0 - 10);
                    this.ctx.fillText(`P₁(${calc.x1}, ${calc.y1})`, canvasX1, canvasY1 - 10);
                },
                
                drawGrid: function(xMin, xMax, yMin, yMax, toCanvasX, toCanvasY) {
                    const width = this.canvas.width;
                    const height = this.canvas.height;
                    
                    // Dibujar líneas de grid
                    this.ctx.strokeStyle = '#ecf0f1';
                    this.ctx.lineWidth = 0.5;
                    
                    // Determinar el paso del grid
                    const rangeX = xMax - xMin;
                    const rangeY = yMax - yMin;
                    const stepX = this.calculateGridStep(rangeX);
                    const stepY = this.calculateGridStep(rangeY);
                    
                    // Líneas horizontales
                    for (let y = Math.floor(yMin / stepY) * stepY; y <= yMax; y += stepY) {
                        const canvasY = toCanvasY(y);
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, canvasY);
                        this.ctx.lineTo(width, canvasY);
                        this.ctx.stroke();
                        
                        // Etiquetas de eje Y
                        if (Math.abs(y) > 0.001) { // No etiquetar el cero
                            this.ctx.fillStyle = '#95a5a6';
                            this.ctx.font = '10px Arial';
                            this.ctx.textAlign = 'right';
                            this.ctx.fillText(y.toFixed(1), 25, canvasY - 5);
                        }
                    }
                    
                    // Líneas verticales
                    for (let x = Math.floor(xMin / stepX) * stepX; x <= xMax; x += stepX) {
                        const canvasX = toCanvasX(x);
                        this.ctx.beginPath();
                        this.ctx.moveTo(canvasX, 0);
                        this.ctx.lineTo(canvasX, height);
                        this.ctx.stroke();
                        
                        // Etiquetas de eje X
                        if (Math.abs(x) > 0.001) { // No etiquetar el cero
                            this.ctx.fillStyle = '#95a5a6';
                            this.ctx.font = '10px Arial';
                            this.ctx.textAlign = 'center';
                            this.ctx.fillText(x.toFixed(1), canvasX, height - 5);
                        }
                    }
                    
                    // Dibujar ejes principales
                    this.ctx.strokeStyle = '#bdc3c7';
                    this.ctx.lineWidth = 1;
                    
                    // Eje X
                    const axisY = toCanvasY(0);
                    if (axisY >= 0 && axisY <= height) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(0, axisY);
                        this.ctx.lineTo(width, axisY);
                        this.ctx.stroke();
                    }
                    
                    // Eje Y
                    const axisX = toCanvasX(0);
                    if (axisX >= 0 && axisX <= width) {
                        this.ctx.beginPath();
                        this.ctx.moveTo(axisX, 0);
                        this.ctx.lineTo(axisX, height);
                        this.ctx.stroke();
                    }
                    
                    // Origen
                    if (axisX >= 0 && axisX <= width && axisY >= 0 && axisY <= height) {
                        this.ctx.fillStyle = '#2c3e50';
                        this.ctx.font = '12px Arial';
                        this.ctx.textAlign = 'right';
                        this.ctx.fillText("O", axisX - 5, axisY + 15);
                    }
                },
                
                calculateGridStep: function(range) {
                    const targetSteps = 8; // Número deseado de líneas de grid
                    let step = Math.pow(10, Math.floor(Math.log10(range)));
                    
                    // Ajustar el paso según el rango
                    if (range / step < targetSteps / 2) {
                        step = step / 5;
                    } else if (range / step < targetSteps) {
                        step = step / 2;
                    }
                    
                    return step;
                },
                
                updateTable: function(precomputedCalc) {
                    const calc = precomputedCalc || this.calculateDistances();
                    const showHorizontal = document.getElementById('showHorizontal').checked;
                    const showVertical = document.getElementById('showVertical').checked;
                    
                    const tableBody = document.getElementById('resultsTableBody');
                    tableBody.innerHTML = '';
                    
                    // Añadir los puntos
                    this.addTableRow(tableBody, "Punto P₀", "Punto inicial", `(${calc.x0}, ${calc.y0})`, "element-negro");
                    this.addTableRow(tableBody, "Punto P₁", "Punto final", `(${calc.x1}, ${calc.y1})`, "element-negro");
                    
                    // Añadir catetos condicionalmente
                    if (showHorizontal) {
                        this.addTableRow(tableBody, "Cateto Horizontal (Δx)", "Diferencia en coordenada x", calc.catetoH.toFixed(4), "element-azul");
                    }
                    
                    if (showVertical) {
                        this.addTableRow(tableBody, "Cateto Vertical (Δy)", "Diferencia en coordenada y", calc.catetoV.toFixed(4), "element-azul");
                    }
                    
                    // Añadir hipotenusa (siempre visible)
                    this.addTableRow(tableBody, "Hipotenusa (Distancia)", "Distancia euclidiana directa", calc.hipotenusa.toFixed(4), "element-rojo");
                    
                    // Añadir verificación de Pitágoras solo si ambos catetos están visibles
                    if (showHorizontal && showVertical) {
                        this.addTableRow(tableBody, "Verificación Pitágoras", "√(Δx² + Δy²)", calc.pitagoras.toFixed(4), "element-verificacion");
                    }
                },

                updateSummary: function(calc, triggeredByButton) {
                    const summaryEl = document.getElementById('distanceResultSummary');
                    if (!summaryEl) return;

                    const { x0, y0, x1, y1, hipotenusa } = calc;
                    const pointsDefined = [x0, y0, x1, y1].every(value => Number.isFinite(value));

                    if (!pointsDefined || !Number.isFinite(hipotenusa)) {
                        summaryEl.textContent = "Completa valores numéricos válidos para calcular la distancia.";
                        summaryEl.classList.remove('distance-summary-flash');
                        return;
                    }

                    summaryEl.textContent = `Distancia entre P₀(${x0}, ${y0}) y P₁(${x1}, ${y1}) → d = ${hipotenusa.toFixed(4)}`;

                    summaryEl.classList.remove('distance-summary-flash');
                    if (triggeredByButton) {
                        void summaryEl.offsetWidth;
                        summaryEl.classList.add('distance-summary-flash');
                    }
                },
                
                addTableRow: function(tableBody, elemento, descripcion, valor, colorClass) {
                    const row = tableBody.insertRow();
                    row.className = colorClass;
                    
                    const cell1 = row.insertCell(0);
                    const cell2 = row.insertCell(1);
                    const cell3 = row.insertCell(2);
                    
                    cell1.textContent = elemento;
                    cell2.textContent = descripcion;
                    cell3.textContent = valor;
                }
            } // End of app.distanciaPuntos
        };
