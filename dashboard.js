document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const tableBody = document.getElementById('products-table-body');
    const searchInput = document.querySelector('.search-input');
    const addProductButton = document.getElementById('add-product');
    const productDialog = document.getElementById('product-dialog');
    const productForm = document.getElementById('product-form');
    const datasetStatus = document.getElementById('dataset-status');
    const categoryFilter = document.getElementById('category-filter');
    const cityFilter = document.getElementById('city-filter');
    const statusFilter = document.getElementById('status-filter');
    const clearFiltersButton = document.getElementById('clear-filters');
    const resultCount = document.getElementById('products-result-count');
    const cardsContainer = document.getElementById('products-card-grid');
    const tableContainer = document.getElementById('products-table-container');
    const showCardsButton = document.getElementById('show-cards');
    const showTableButton = document.getElementById('show-table');
    const categoryChartCanvas = document.getElementById('category-chart');
    const categoryChartFallback = document.getElementById('category-chart-fallback');
    const categoryChartStatus = document.getElementById('category-chart-status');
    const storageKey = 'ecomarket-products-v2';
    const numberFormat = new Intl.NumberFormat('es-CO');
    const validator = window.validarProductos;
    const categories = [
        'Frutas y verduras',
        'Despensa',
        'Cuidado personal',
        'Hogar sostenible'
    ];

    if (
        !menuToggle
        || !sidebar
        || !tableBody
        || !productDialog
        || !productForm
        || !datasetStatus
        || !categoryFilter
        || !cityFilter
        || !statusFilter
        || !clearFiltersButton
        || !resultCount
        || !cardsContainer
        || !tableContainer
        || !showCardsButton
        || !showTableButton
        || !categoryChartCanvas
        || !categoryChartFallback
        || !categoryChartStatus
        || !Array.isArray(window.productosEjemplo)
        || typeof validator !== 'function'
    ) {
        return;
    }

    const exampleErrors = validator(window.productosEjemplo);
    if (exampleErrors.length > 0) {
        showStatus(
            `Los cinco registros de ejemplo no pasaron la validación: ${exampleErrors.map((error) => `${error.campo}: ${error.descripcion}`).join(' ')}`,
            true
        );
        return;
    }

    let products = [];
    let editingId = null;
    let nextProductId = 1;
    let categoryChart = null;
    let catalogView = 'cards';

    function showStatus(message, isError = false) {
        datasetStatus.textContent = message;
        datasetStatus.classList.toggle('is-error', isError);
        datasetStatus.classList.toggle('is-success', !isError);
        datasetStatus.setAttribute('role', isError ? 'alert' : 'status');
    }

    function showValidationErrors(errors) {
        const details = errors
            .map((error) => `ID ${error.id}, ${error.campo}: ${error.descripcion}`)
            .join(' ');
        showStatus(`El catálogo no pasó la validación. ${details}`, true);
    }

    function getProductStatus(product) {
        if (product.stock === 0) {
            return { label: 'Agotado', className: 'badge-agotado' };
        }
        if (product.stock <= product.stockMinimo) {
            return { label: 'Stock bajo', className: 'badge-stock-bajo' };
        }
        return { label: 'Disponible', className: 'badge-disponible' };
    }

    function createActionButton(action, product) {
        const button = document.createElement('button');
        const actionLabel = action === 'edit' ? 'Editar' : 'Eliminar';
        button.type = 'button';
        button.className = `btn-accion ${action === 'edit' ? 'btn-editar' : 'btn-eliminar'}`;
        button.dataset.action = action;
        button.dataset.id = String(product.id);
        button.setAttribute('aria-label', `${actionLabel} ECO${String(product.id).padStart(3, '0')}`);
        button.textContent = actionLabel;
        return button;
    }

    function renderProducts() {
        const query = searchInput?.value.trim().toLocaleLowerCase('es') || '';
        const activeProducts = products.filter((product) => product.activo);
        const visibleProducts = products.filter((product) => {
            if (!product.activo) {
                return false;
            }
            const status = getProductStatus(product).label;
            if (
                (categoryFilter.value && product.categoria !== categoryFilter.value)
                || (cityFilter.value && product.ciudad !== cityFilter.value)
                || (statusFilter.value && status !== statusFilter.value)
            ) {
                return false;
            }
            const searchableText = [
                product.id,
                product.nombre,
                product.categoria,
                product.precio,
                product.stock,
                product.stockMinimo,
                product.productor,
                product.ciudad,
                product.organico ? 'orgánico' : 'convencional',
                status
            ].join(' ').toLocaleLowerCase('es');
            return searchableText.includes(query);
        });

        tableBody.replaceChildren();
        cardsContainer.replaceChildren();
        resultCount.textContent = `Mostrando ${visibleProducts.length} de ${activeProducts.length} productos.`;

        if (visibleProducts.length === 0) {
            const hasFilters = query || categoryFilter.value || cityFilter.value || statusFilter.value;
            const emptyMessage = hasFilters
                ? 'No se encontraron productos con esos criterios.'
                : 'No hay productos activos para mostrar.';
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.className = 'empty-table-message';
            cell.textContent = emptyMessage;
            row.append(cell);
            tableBody.append(row);
            const emptyCardMessage = document.createElement('p');
            emptyCardMessage.className = 'empty-table-message';
            emptyCardMessage.textContent = emptyMessage;
            cardsContainer.append(emptyCardMessage);
        }

        visibleProducts.forEach((product) => {
            const row = document.createElement('tr');
            const productCell = document.createElement('td');
            const code = document.createElement('span');
            const name = document.createElement('strong');
            const categoryCell = document.createElement('td');
            const priceCell = document.createElement('td');
            const stockCell = document.createElement('td');
            const producerCell = document.createElement('td');
            const statusCell = document.createElement('td');
            const actionsCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            const status = getProductStatus(product);

            productCell.className = 'td-producto';
            code.className = 'td-codigo';
            code.textContent = `ECO${String(product.id).padStart(3, '0')}`;
            name.textContent = product.nombre;
            productCell.append(code, name);

            categoryCell.textContent = product.categoria;
            priceCell.className = 'td-precio';
            priceCell.textContent = `$${numberFormat.format(product.precio)}`;
            stockCell.textContent = String(product.stock);
            producerCell.textContent = `${product.productor} · ${product.ciudad}`;
            statusBadge.className = `badge ${status.className}`;
            statusBadge.textContent = status.label;
            statusCell.append(statusBadge);

            actionsCell.className = 'td-acciones';
            actionsCell.append(createActionButton('edit', product), createActionButton('delete', product));
            row.append(productCell, categoryCell, priceCell, stockCell, producerCell, statusCell, actionsCell);
            tableBody.append(row);

            const card = document.createElement('article');
            const cardHeader = document.createElement('div');
            const codeLabel = document.createElement('span');
            const cardStatus = document.createElement('span');
            const cardName = document.createElement('h3');
            const cardDetails = document.createElement('p');
            const cardPrice = document.createElement('p');
            const cardInventory = document.createElement('p');
            const cardActions = document.createElement('div');

            card.className = 'card catalog-product-card';
            cardHeader.className = 'catalog-product-header';
            codeLabel.className = 'td-codigo';
            codeLabel.textContent = `ECO${String(product.id).padStart(3, '0')}`;
            cardStatus.className = `badge ${status.className}`;
            cardStatus.textContent = status.label;
            cardHeader.append(codeLabel, cardStatus);
            cardName.className = 'producto-title';
            cardName.textContent = product.nombre;
            cardDetails.className = 'catalog-product-details';
            cardDetails.textContent = `${product.categoria} · ${product.ciudad}`;
            cardPrice.className = 'catalog-product-price';
            cardPrice.textContent = `$${numberFormat.format(product.precio)} COP`;
            cardInventory.className = 'catalog-product-inventory';
            cardInventory.textContent = `Stock: ${product.stock} · ${product.productor}`;
            cardActions.className = 'catalog-product-actions';
            cardActions.append(createActionButton('edit', product), createActionButton('delete', product));
            card.append(cardHeader, cardName, cardDetails, cardPrice, cardInventory, cardActions);
            cardsContainer.append(card);
        });

        cardsContainer.hidden = catalogView !== 'cards';
        tableContainer.hidden = catalogView !== 'table';
        updateSummary();
    }

    function updateSummary() {
        const activeProducts = products.filter((product) => product.activo);
        const lowStockCount = activeProducts.filter(
            (product) => product.stock <= product.stockMinimo
        ).length;
        const inventoryValue = activeProducts.reduce(
            (total, product) => total + product.precio * product.stock,
            0
        );

        document.getElementById('products-count').textContent = String(activeProducts.length);
        document.getElementById('low-stock-count').textContent = String(lowStockCount);
        document.getElementById('inventory-value').textContent = `$${numberFormat.format(inventoryValue)}`;

        const producerSummary = document.getElementById('producer-summary');
        if (producerSummary) {
            const producerCounts = new Map();
            activeProducts.forEach((product) => {
                producerCounts.set(product.productor, (producerCounts.get(product.productor) || 0) + 1);
            });
            producerSummary.replaceChildren();
            producerCounts.forEach((count, producer) => {
                const item = document.createElement('li');
                item.textContent = `${producer} — ${count} ${count === 1 ? 'producto' : 'productos'}`;
                producerSummary.append(item);
            });
        }

        updateCategoryChart(activeProducts);
    }

    function updateCategoryChart(activeProducts) {
        const categoryCounts = categories.map(
            (category) => activeProducts.filter((product) => product.categoria === category).length
        );
        const chartDescription = categories
            .map((category, index) => `${category}: ${categoryCounts[index]}`)
            .join('; ');

        if (typeof window.Chart === 'function') {
            categoryChartCanvas.hidden = false;
            categoryChartFallback.hidden = true;
            categoryChartCanvas.setAttribute('aria-label', `Productos por categoría. ${chartDescription}`);

            if (!categoryChart) {
                categoryChart = new window.Chart(categoryChartCanvas, {
                    type: 'bar',
                    data: {
                        labels: categories,
                        datasets: [{
                            label: 'Productos activos',
                            data: categoryCounts,
                            backgroundColor: ['#9acb85', '#6fae61', '#d96b43', '#4b7550'],
                            borderRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { precision: 0 }
                            }
                        },
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            } else {
                categoryChart.data.datasets[0].data = categoryCounts;
                categoryChart.update();
            }
            categoryChartStatus.textContent = 'Gráfico actualizado.';
            return;
        }

        categoryChartCanvas.hidden = true;
        categoryChartFallback.hidden = false;
        categoryChartFallback.replaceChildren();
        const maximumCount = Math.max(...categoryCounts, 1);
        categories.forEach((category, index) => {
            const item = document.createElement('li');
            const label = document.createElement('span');
            const count = document.createElement('strong');
            const bar = document.createElement('span');

            item.className = 'category-chart-item';
            label.textContent = category;
            count.textContent = String(categoryCounts[index]);
            bar.className = 'category-chart-bar';
            bar.setAttribute('aria-hidden', 'true');
            bar.style.width = `${(categoryCounts[index] / maximumCount) * 100}%`;
            item.append(label, count, bar);
            categoryChartFallback.append(item);
        });
        categoryChartStatus.textContent = 'Chart.js no está disponible; se muestra el resumen equivalente.';
    }

    function handleProductAction(event) {
        if (!(event.target instanceof Element)) {
            return;
        }
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }

        const id = Number(button.dataset.id);
        const product = products.find((item) => item.id === id);
        if (!product) {
            return;
        }
        if (button.dataset.action === 'edit') {
            openProductDialog(product);
        } else if (
            button.dataset.action === 'delete'
            && window.confirm(`¿Eliminar ${product.nombre} (ECO${String(id).padStart(3, '0')})?`)
        ) {
            const nextProducts = products.filter((item) => item.id !== id);
            persistProducts(nextProducts);
        }
    }

    function closeMenu() {
        sidebar.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menú de navegación');
        menuToggle.textContent = '☰';
    }

    function openProductDialog(product = null) {
        productForm.reset();
        editingId = product?.id ?? null;
        document.getElementById('product-dialog-title').textContent = product
            ? `Editar ECO${String(product.id).padStart(3, '0')}`
            : 'Añadir producto';
        productForm.elements.namedItem('nombre').value = product?.nombre || '';
        productForm.elements.namedItem('categoria').value = product?.categoria || '';
        productForm.elements.namedItem('precio').value = product?.precio ?? '';
        productForm.elements.namedItem('stock').value = product?.stock ?? '';
        productForm.elements.namedItem('stockMinimo').value = product?.stockMinimo ?? '';
        productForm.elements.namedItem('productor').value = product?.productor || '';
        productForm.elements.namedItem('ciudad').value = product?.ciudad || '';
        productForm.elements.namedItem('fechaRegistro').value = product?.fechaRegistro || '2026-11-03';
        productForm.elements.namedItem('organico').checked = product?.organico ?? false;
        productDialog.showModal();
        productForm.elements.namedItem('nombre').focus();
    }

    function persistProducts(nextProducts) {
        const errors = validator(nextProducts);
        if (errors.length > 0) {
            showValidationErrors(errors);
            return false;
        }

        try {
            localStorage.setItem(storageKey, JSON.stringify(nextProducts));
        } catch (error) {
            showStatus(`No se pudo guardar el catálogo en este navegador: ${error.message}`, true);
            return false;
        }

        products = nextProducts;
        nextProductId = products.reduce((highest, product) => Math.max(highest, product.id), 0) + 1;
        renderProducts();
        showStatus('Cambios guardados en este navegador.');
        return true;
    }

    async function loadProducts() {
        addProductButton.disabled = true;
        try {
            let savedCatalog;
            try {
                savedCatalog = localStorage.getItem(storageKey);
            } catch (error) {
                showStatus(`No se pudieron leer los cambios guardados: ${error.message}`, true);
                return;
            }

            if (savedCatalog !== null) {
                let parsedCatalog;
                try {
                    parsedCatalog = JSON.parse(savedCatalog);
                } catch (error) {
                    showStatus(`Los cambios guardados no contienen JSON válido: ${error.message}`, true);
                    return;
                }
                const savedErrors = validator(parsedCatalog);
                if (savedErrors.length > 0) {
                    showValidationErrors(savedErrors);
                    return;
                }

                products = parsedCatalog;
                nextProductId = products.reduce((highest, product) => Math.max(highest, product.id), 0) + 1;
                renderProducts();
                addProductButton.disabled = false;
                showStatus(`Catálogo cargado desde este navegador: ${products.filter((product) => product.activo).length} productos activos.`);
                return;
            }

            const response = await fetch('productos.json');
            if (!response.ok) {
                throw new Error(`No se pudo cargar productos.json (HTTP ${response.status}).`);
            }

            const catalog = await response.json();
            const catalogErrors = validator(catalog);
            if (catalogErrors.length > 0) {
                showValidationErrors(catalogErrors);
                return;
            }

            const catalogById = new Map(catalog.map((product) => [product.id, product]));
            const examplesMatchCatalog = window.productosEjemplo.every((example) => {
                const catalogProduct = catalogById.get(example.id);
                return catalogProduct
                    && Object.keys(example).length === Object.keys(catalogProduct).length
                    && Object.entries(example).every(([key, value]) => catalogProduct[key] === value);
            });
            if (!examplesMatchCatalog) {
                showStatus('Los cinco ejemplos deben coincidir con los registros 1 a 5 de productos.json.', true);
                return;
            }

            const exampleIds = new Set(window.productosEjemplo.map((product) => product.id));
            const mergedCatalog = [
                ...window.productosEjemplo,
                ...catalog.filter((product) => !exampleIds.has(product.id))
            ];
            if (mergedCatalog.length !== catalog.length) {
                showStatus('No se pudieron integrar los ejemplos sin duplicar registros del catálogo.', true);
                return;
            }
            const mergedErrors = validator(mergedCatalog);
            if (mergedErrors.length > 0) {
                showValidationErrors(mergedErrors);
                return;
            }

            products = mergedCatalog;
            nextProductId = products.reduce((highest, product) => Math.max(highest, product.id), 0) + 1;
            renderProducts();
            addProductButton.disabled = false;
            showStatus(`Catálogo cargado y validado: ${products.filter((product) => product.activo).length} productos activos.`);
        } catch (error) {
            showStatus(`No se pudo iniciar el catálogo. Abre el proyecto con Live Server y verifica productos.json. ${error.message}`, true);
            console.error(error);
        }
    }

    menuToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        if (sidebar.classList.contains('active')) {
            closeMenu();
            return;
        }
        sidebar.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Cerrar menú de navegación');
        menuToggle.textContent = '×';
    });

    sidebar.querySelectorAll('.sidebar-link').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });

    document.addEventListener('click', (event) => {
        if (
            window.innerWidth < 1024
            && !sidebar.contains(event.target)
            && !menuToggle.contains(event.target)
        ) {
            closeMenu();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) {
            closeMenu();
        }
    });

    addProductButton.addEventListener('click', () => openProductDialog());
    document.getElementById('close-product-dialog').addEventListener('click', () => productDialog.close());
    document.getElementById('cancel-product-dialog').addEventListener('click', () => productDialog.close());
    searchInput?.addEventListener('input', renderProducts);
    categoryFilter.addEventListener('change', renderProducts);
    cityFilter.addEventListener('change', renderProducts);
    statusFilter.addEventListener('change', renderProducts);
    showCardsButton.addEventListener('click', () => {
        catalogView = 'cards';
        showCardsButton.classList.add('is-active');
        showCardsButton.classList.remove('btn-outline');
        showCardsButton.setAttribute('aria-pressed', 'true');
        showTableButton.classList.remove('is-active');
        showTableButton.classList.add('btn-outline');
        showTableButton.setAttribute('aria-pressed', 'false');
        renderProducts();
    });
    showTableButton.addEventListener('click', () => {
        catalogView = 'table';
        showTableButton.classList.add('is-active');
        showTableButton.classList.remove('btn-outline');
        showTableButton.setAttribute('aria-pressed', 'true');
        showCardsButton.classList.remove('is-active');
        showCardsButton.classList.add('btn-outline');
        showCardsButton.setAttribute('aria-pressed', 'false');
        renderProducts();
    });
    clearFiltersButton.addEventListener('click', () => {
        if (searchInput) {
            searchInput.value = '';
        }
        categoryFilter.value = '';
        cityFilter.value = '';
        statusFilter.value = '';
        renderProducts();
    });

    productForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!productForm.reportValidity()) {
            return;
        }

        const formData = new FormData(productForm);
        const existingProduct = editingId === null
            ? null
            : products.find((product) => product.id === editingId);
        const updatedProduct = {
            id: editingId ?? nextProductId,
            nombre: String(formData.get('nombre')).trim(),
            categoria: String(formData.get('categoria')),
            precio: Number(formData.get('precio')),
            stock: Number(formData.get('stock')),
            stockMinimo: Number(formData.get('stockMinimo')),
            productor: String(formData.get('productor')).trim(),
            ciudad: String(formData.get('ciudad')),
            organico: formData.has('organico'),
            fechaRegistro: String(formData.get('fechaRegistro')),
            activo: existingProduct?.activo ?? true
        };
        const nextProducts = editingId === null
            ? [...products, updatedProduct]
            : products.map((product) => product.id === editingId ? updatedProduct : product);

        if (persistProducts(nextProducts)) {
            productDialog.close();
        }
    });

    tableBody.addEventListener('click', handleProductAction);
    cardsContainer.addEventListener('click', handleProductAction);

    loadProducts();
});
