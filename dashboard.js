document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const tableBody = document.getElementById('products-table-body');
    const searchInput = document.querySelector('.search-input');
    const addProductButton = document.getElementById('add-product');
    const productDialog = document.getElementById('product-dialog');
    const productForm = document.getElementById('product-form');
    const confirmDelete = document.getElementById('confirm-delete');

    if (!menuToggle || !sidebar || !tableBody || !productDialog || !productForm) {
        return;
    }

    const numberFormat = new Intl.NumberFormat('es-CO');
    const products = [...tableBody.querySelectorAll('tr')].map((row) => {
        const cells = row.cells;
        const productCell = cells[0];

        return {
            code: productCell.querySelector('.td-codigo').textContent.trim(),
            name: productCell.querySelector('strong').textContent.trim(),
            variant: productCell.querySelector('.variante')?.textContent.trim() || '',
            category: cells[1].textContent.trim(),
            price: Number(cells[2].textContent.replace(/\D/g, '')),
            stock: Number(cells[3].textContent.trim()),
            producer: cells[4].textContent.trim()
        };
    });

    let editingCode = null;
    let nextProductNumber = products.reduce((highest, product) => {
        const match = product.code.match(/\d+$/);
        return Math.max(highest, match ? Number(match[0]) : 0);
    }, 0) + 1;

    function getProductStatus(stock) {
        if (stock === 0) {
            return { label: 'Agotado', className: 'badge-agotado' };
        }
        if (stock <= 5) {
            return { label: 'Stock bajo', className: 'badge-stock-bajo' };
        }
        return { label: 'Disponible', className: 'badge-disponible' };
    }

    function renderProducts() {
        const query = searchInput?.value.trim().toLocaleLowerCase('es') || '';
        const visibleProducts = products.filter((product) => {
            const status = getProductStatus(product.stock).label;
            const searchableText = [
                product.code,
                product.name,
                product.variant,
                product.category,
                product.price,
                product.stock,
                product.producer,
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
            cell.textContent = 'No se encontraron productos.';
            row.append(cell);
            tableBody.append(row);
        }

        visibleProducts.forEach((product) => {
            const row = document.createElement('tr');
            const productCell = document.createElement('td');
            const code = document.createElement('span');
            const name = document.createElement('strong');
            const variant = document.createElement('span');

            productCell.className = 'td-producto';
            code.className = 'td-codigo';
            code.textContent = product.code;
            name.textContent = product.name;
            variant.className = 'variante';
            variant.textContent = product.variant;
            productCell.append(code, name);
            if (product.variant) {
                productCell.append(variant);
            }
            row.append(productCell);

            [
                product.category,
                `$${numberFormat.format(product.price)}`,
                String(product.stock),
                product.producer
            ].forEach((value, index) => {
                const cell = document.createElement('td');
                cell.textContent = value;
                if (index === 1) {
                    cell.className = 'td-precio';
                }
                row.append(cell);
            });

            const statusCell = document.createElement('td');
            const statusBadge = document.createElement('span');
            const status = getProductStatus(product.stock);
            statusBadge.className = `badge ${status.className}`;
            statusBadge.textContent = status.label;
            statusCell.append(statusBadge);
            row.append(statusCell);

            const actionsCell = document.createElement('td');
            const editButton = document.createElement('button');
            const deleteButton = document.createElement('button');
            actionsCell.className = 'td-acciones';
            editButton.type = 'button';
            editButton.className = 'btn-accion btn-editar';
            editButton.dataset.action = 'edit';
            editButton.dataset.code = product.code;
            editButton.setAttribute('aria-label', `Editar ${product.code}`);
            editButton.textContent = 'Editar';
            deleteButton.type = 'button';
            deleteButton.className = 'btn-accion btn-eliminar';
            deleteButton.dataset.action = 'delete';
            deleteButton.dataset.code = product.code;
            deleteButton.setAttribute('aria-label', `Eliminar ${product.code}`);
            deleteButton.textContent = 'Eliminar';
            actionsCell.append(editButton, deleteButton);
            row.append(actionsCell);
            tableBody.append(row);
        });

        updateSummary();
    }

    function updateSummary() {
        const lowStockCount = products.filter((product) => product.stock > 0 && product.stock <= 5).length;
        const inventoryValue = products.reduce((total, product) => total + product.price * product.stock, 0);
        const productsCount = document.getElementById('products-count');
        const lowStockElement = document.getElementById('low-stock-count');
        const inventoryValueElement = document.getElementById('inventory-value');

        productsCount.textContent = String(products.length);
        lowStockElement.textContent = String(lowStockCount);
        inventoryValueElement.textContent = `$${numberFormat.format(inventoryValue)}`;

        const producerSummary = document.getElementById('producer-summary');
        if (producerSummary) {
            const producerCounts = new Map();
            products.forEach((product) => {
                producerCounts.set(product.producer, (producerCounts.get(product.producer) || 0) + 1);
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
        editingCode = product?.code || null;
        document.getElementById('product-dialog-title').textContent = product
            ? `Editar ${product.code}`
            : 'Añadir producto';
        productForm.elements.namedItem('name').value = product?.name || '';
        productForm.elements.namedItem('variant').value = product?.variant || '';
        productForm.elements.namedItem('category').value = product?.category || '';
        productForm.elements.namedItem('price').value = product?.price ?? '';
        productForm.elements.namedItem('stock').value = product?.stock ?? '';
        productForm.elements.namedItem('producer').value = product?.producer || '';
        productDialog.showModal();
        productForm.elements.namedItem('name').focus();
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

    addProductButton?.addEventListener('click', () => openProductDialog());
    document.getElementById('close-product-dialog').addEventListener('click', () => productDialog.close());
    document.getElementById('cancel-product-dialog').addEventListener('click', () => productDialog.close());
    searchInput?.addEventListener('input', renderProducts);

    productForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(productForm);
        const productData = {
            name: formData.get('name').trim(),
            variant: formData.get('variant').trim(),
            category: formData.get('category').trim(),
            price: Number(formData.get('price')),
            stock: Number(formData.get('stock')),
            producer: formData.get('producer').trim()
        };

        if (editingCode) {
            const product = products.find((item) => item.code === editingCode);
            Object.assign(product, productData);
        } else {
            const code = `ECO${String(nextProductNumber).padStart(3, '0')}`;
            nextProductNumber += 1;
            products.push({ code, ...productData });
        }

        productDialog.close();
        renderProducts();
    });

    tableBody.addEventListener('click', (event) => {
        if (!(event.target instanceof Element)) {
            return;
        }
        const button = event.target.closest('button[data-action]');
        if (!button) {
            return;
        }

        const product = products.find((item) => item.code === button.dataset.code);
        if (!product) {
            return;
        }
        if (button.dataset.action === 'edit') {
            openProductDialog(product);
        } else if (
            button.dataset.action === 'delete'
            && (!confirmDelete.checked || window.confirm(`¿Eliminar ${product.name} (${product.code})?`))
        ) {
            products.splice(products.indexOf(product), 1);
            renderProducts();
        }
    });

    renderProducts();
});
