function validarProductos(lista) {
    const errores = [];
    const idsVistos = new Set();
    const categoriasValidas = [
        'Frutas y verduras',
        'Despensa',
        'Cuidado personal',
        'Hogar sostenible'
    ];
    const ciudadesValidas = [
        'Bucaramanga',
        'Floridablanca',
        'Girón',
        'Bogotá',
        'Medellín',
        'Cali',
        'Tunja',
        'Cúcuta'
    ];

    if (!Array.isArray(lista)) {
        return [{
            id: 'General',
            campo: 'dataset',
            descripcion: 'El dataset no es un arreglo válido.'
        }];
    }

    lista.forEach((producto, index) => {
        const esObjeto = producto !== null && typeof producto === 'object' && !Array.isArray(producto);
        const prod = esObjeto ? producto : {};
        const refId = prod.id !== undefined ? prod.id : `Índice ${index}`;

        if (!esObjeto) {
            errores.push({
                id: refId,
                campo: 'producto',
                descripcion: 'Cada registro debe ser un objeto de producto.'
            });
        }

        if (typeof prod.id !== 'number' || !Number.isInteger(prod.id) || prod.id <= 0) {
            errores.push({
                id: refId,
                campo: 'id',
                descripcion: 'El ID debe ser un número entero mayor que 0.'
            });
        } else if (idsVistos.has(prod.id)) {
            errores.push({
                id: refId,
                campo: 'id',
                descripcion: `El ID ${prod.id} está repetido.`
            });
        } else {
            idsVistos.add(prod.id);
        }

        if (typeof prod.nombre !== 'string' || prod.nombre.trim().length < 3 || prod.nombre.trim().length > 80) {
            errores.push({
                id: refId,
                campo: 'nombre',
                descripcion: 'El nombre debe tener entre 3 y 80 caracteres.'
            });
        }

        if (!categoriasValidas.includes(prod.categoria)) {
            errores.push({
                id: refId,
                campo: 'categoria',
                descripcion: `La categoría '${prod.categoria}' no es válida.`
            });
        }

        if (typeof prod.precio !== 'number' || !Number.isInteger(prod.precio) || prod.precio <= 0) {
            errores.push({
                id: refId,
                campo: 'precio',
                descripcion: 'El precio debe ser un número entero mayor que 0.'
            });
        }

        if (typeof prod.stock !== 'number' || !Number.isInteger(prod.stock) || prod.stock < 0) {
            errores.push({
                id: refId,
                campo: 'stock',
                descripcion: 'El stock debe ser un número entero mayor o igual a 0.'
            });
        }

        if (
            typeof prod.stockMinimo !== 'number'
            || !Number.isInteger(prod.stockMinimo)
            || prod.stockMinimo < 0
        ) {
            errores.push({
                id: refId,
                campo: 'stockMinimo',
                descripcion: 'El stock mínimo debe ser un número entero mayor o igual a 0.'
            });
        }

        if (
            typeof prod.productor !== 'string'
            || prod.productor.trim().length < 3
            || prod.productor.trim().length > 80
        ) {
            errores.push({
                id: refId,
                campo: 'productor',
                descripcion: 'El productor debe tener entre 3 y 80 caracteres.'
            });
        }

        if (!ciudadesValidas.includes(prod.ciudad)) {
            errores.push({
                id: refId,
                campo: 'ciudad',
                descripcion: `La ciudad '${prod.ciudad}' no pertenece a las permitidas.`
            });
        }

        if (typeof prod.organico !== 'boolean') {
            errores.push({
                id: refId,
                campo: 'organico',
                descripcion: 'El campo organico debe ser booleano (true/false).'
            });
        }

        if (typeof prod.activo !== 'boolean') {
            errores.push({
                id: refId,
                campo: 'activo',
                descripcion: 'El campo activo debe ser booleano (true/false).'
            });
        }

        const fechaValida = typeof prod.fechaRegistro === 'string'
            && /^\d{4}-\d{2}-\d{2}$/.test(prod.fechaRegistro)
            && !Number.isNaN(Date.parse(`${prod.fechaRegistro}T00:00:00Z`))
            && new Date(`${prod.fechaRegistro}T00:00:00Z`).toISOString().slice(0, 10) === prod.fechaRegistro;

        if (!fechaValida) {
            errores.push({
                id: refId,
                campo: 'fechaRegistro',
                descripcion: 'La fecha debe ser una fecha válida con formato YYYY-MM-DD.'
            });
        } else if (prod.fechaRegistro < '2026-01-01' || prod.fechaRegistro > '2026-11-03') {
            errores.push({
                id: refId,
                campo: 'fechaRegistro',
                descripcion: 'La fecha debe estar entre 2026-01-01 y 2026-11-03.'
            });
        }
    });

    return errores;
}

window.validarProductos = validarProductos;
