document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const tableBody = document.getElementById('products-table-body');
    const searchInput = document.querySelector('.search-input');
    const addProductButton = document.getElementById('add-product');
    const productDialog = document.getElementById('product-dialog');
    const productForm = document.getElementById('product-form');
    const confirmDelete = document.getElementById('confirm-delete');
    const datasetStatus = document.getElementById('dataset-status');
    const storageKey = 'ecomarket-products-v2';
    const numberFormat = new Intl.NumberFormat('es-CO');
    const validator = window.validarProductos;

    if (
        !menuToggle
        || !sidebar
        || !tableBody
        || !productDialog
        || !productForm
        || !datasetStatus
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

    function renderProducts() {
        const query = searchInput?.value.trim().toLocaleLowerCase('es') || '';
        const visibleProducts = products.filter((product) => {
            if (!product.activo) {
                return false;
            }
            const status = getProductStatus(product).label;
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

        if (visibleProducts.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 7;
            cell.className = 'empty-table-message';
            cell.textContent = query
                ? 'No se encontraron productos con esa búsqueda.'
                : 'No hay productos activos para mostrar.';
            row.append(cell);
            tableBody.append(row);
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
            const editButton = document.createElement('button');
            const deleteButton = document.createElement('button');
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
            editButton.type = 'button';
            editButton.className = 'btn-accion btn-editar';
            editButton.dataset.action = 'edit';
            editButton.dataset.id = String(product.id);
            editButton.setAttribute('aria-label', `Editar ECO${String(product.id).padStart(3, '0')}`);
            editButton.textContent = 'Editar';
            deleteButton.type = 'button';
            deleteButton.className = 'btn-accion btn-eliminar';
            deleteButton.dataset.action = 'delete';
            deleteButton.dataset.id = String(product.id);
            deleteButton.setAttribute('aria-label', `Eliminar ECO${String(product.id).padStart(3, '0')}`);
            deleteButton.textContent = 'Eliminar';
            actionsCell.append(editButton, deleteButton);
            row.append(productCell, categoryCell, priceCell, stockCell, producerCell, statusCell, actionsCell);
            tableBody.append(row);
        });

        updateSummary();
    }

    function updateSummary() {
        const activeProducts = products.filter((product) => product.activo);
        const lowStockCount = activeProducts.filter(
            (product) => product.stock > 0 && product.stock <= product.stockMinimo
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
            try {
                const savedCatalog = localStorage.getItem(storageKey);
                if (savedCatalog !== null) {
                    const parsedCatalog = JSON.parse(savedCatalog);
                    const savedErrors = validator(parsedCatalog);
                    if (savedErrors.length > 0) {
                        showValidationErrors(savedErrors);
                        return;
                    }
                    products = parsedCatalog;
                }
            } catch (error) {
                showStatus(`No se pudieron leer los cambios guardados: ${error.message}`, true);
                return;
            }

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

    tableBody.addEventListener('click', (event) => {
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
            && (!confirmDelete.checked || window.confirm(`¿Eliminar ${product.nombre} (ECO${String(id).padStart(3, '0')})?`))
        ) {
            const nextProducts = products.filter((item) => item.id !== id);
            persistProducts(nextProducts);
        }
    });

    loadProducts();
});
