import productController from '/js/controllers/product.js';

console.warn('🆗: Módulo PageAlta cargado.');

class PageAlta {

    static productsTableContainer;
    static productForm;
    static fields;
    static btnCreate;
    static btnUpdate;
    static btnCancel;

    static validators = {
        'id': /^[\da-f]{24}$/,
        'name': /^([0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\,\.\'\ \"\-\_\/]){3,30}$/,
        'brand': /^([0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\,\.\'\ \"\-\_\/]){3,40}$/,
        'price': /^\d{1,10}$/, // ("(.[0-9]{1,2})?");
        // 'description': /^.{1,255}$/,
        'minAge': /^\d{1,3}$/,
        'maxAge': /^\d{1,3}$/,
        'stock': /^\d{1,10}$/,
// const regExpProductCategory = new RegExp("^([0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\,\.\'\ \"\-\_\/]){3,50}$");
// const regExpShortDescription = new RegExp("^[0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\,\.\'\"\-\_\/]{0,79}$");
// const regExpLongDescription = new RegExp("^[0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\,\.\'\"\-\_\/]{0,1999}$");
// const regExpAge = new RegExp("\d+");

    };


    static async deleteProduct(e) {
        if (!confirm('¿Estás seguro de querer eliminar el producto?')) {
            return false;
        }
        const row = e.target.closest('tr');
        const id = row.querySelector('td[data-product-property="id"]').innerHTML;
        const deletedProduct = await productController.deleteProduct(id);
        PageAlta.loadTable();
        return deletedProduct;
    }

    static getProductFromRow(row) {
        const rowCells = row.children;
        const product = {};
        for (const cell of rowCells) {
            if (cell.dataset.productProperty) {
                product[cell.dataset.productProperty] = cell.innerHTML;
            }
        }
        return product;
    }


    static emptyForm() {
        PageAlta.fields.forEach(field => field.value = '');
    }

    static async completeForm(e) {
        const row = e.target.closest('tr');
        const productToEdit = PageAlta.getProductFromRow(row);
        console.log('productToEdit:', productToEdit);

        PageAlta.fields.forEach(field => {
            field.value = productToEdit[field.name];
        });

    }

    static async addTableEvents() {
        PageAlta.productsTableContainer.addEventListener('click', async e => {
            if (e.target.classList.contains('btn-delete')) {
                const deletedProduct = await PageAlta.deleteProduct(e);
                console.log('deletedProduct:', deletedProduct);
                if (PageAlta.objectIsEmpty(deletedProduct)) {
                    console.error('No se pudo eliminar el producto');
                }

                return;
            }
            if (e.target.classList.contains('btn-edit')) {
                PageAlta.prepareFormForEditing();
                PageAlta.completeForm(e);
                return;
            }
        });
    }

    static async renderTemplateTable(products) {
        const hbsFile = await fetch('templates/products-table.hbs').then(r => r.text());
        const template = Handlebars.compile(hbsFile);
        const html = template({ products });
        PageAlta.productsTableContainer.innerHTML = html;
    }

    static async loadTable() {
        const products = await productController.getProducts();
        console.log(`Se encontraron ${products.length} productos.`);
        PageAlta.renderTemplateTable(products);
    }

    static async prepareTable() {
        PageAlta.productsTableContainer = document.querySelector('.products-table-container');
        await PageAlta.loadTable();
        PageAlta.addTableEvents();
    }


    static prepareFormForEditing() {
        PageAlta.productForm.querySelector('[name]:not([name="id"])').focus();
        PageAlta.btnCreate.disabled = true;
        PageAlta.btnUpdate.disabled = false;
        PageAlta.btnCancel.disabled = false;
    }

    static prepareFormForCreating() {
        PageAlta.btnCreate.disabled = false;
        PageAlta.btnUpdate.disabled = true;
        PageAlta.btnCancel.disabled = true;
    }

    static validate(value, validator) {
        return validator.test(value);
    }

    static validateForm(validators) {
        let allValidated = true;
        const productToSave = {};
        console.log('\n\n');

        for (const field of PageAlta.fields) {
            if (!validators[field.name]) {
                continue;
            }
            const validated = PageAlta.validate(field.value, validators[field.name]);
            console.warn(field.name);
            console.log(`value: ${field.value}\nvalidator: ${validators[field.name]}\nvalidated: ${validated}`);
            if (!validated) {
                field.focus();
                allValidated = false;
                break;
            } else {
                productToSave[field.name] = field.value;
            }
        }
        console.log('allValidated:', allValidated);
        if (!allValidated) {
            return false;
        }
        return productToSave;
    }

    static async saveProduct(product) {
        const savedProduct = await productController.saveProduct(product);
        return savedProduct;
    }

    static async updateProduct(product) {
        const updatedProduct = await productController.updateProduct(product.id, product);
        return updatedProduct;
    }

    static async addFormEvents() {
        
        PageAlta.btnCreate.addEventListener('click', async e => {
            console.error('btn-create');
            const validators = {...PageAlta.validators};
            delete validators.id;
            // console.log(validators);
            // console.log(PageAlta.validators);
            const productToSave = PageAlta.validateForm(validators);
            console.log('productToSave:', productToSave);
            if (productToSave) {
                const savedProduct = await PageAlta.saveProduct(productToSave);
                console.log('savedProduct:', savedProduct);
                if (PageAlta.objectIsEmpty(savedProduct)) {
                    console.error('No se pudo crear el producto');
                    return;
                }
                const products = await productController.getProducts();
                console.log(`Ahora hay ${products.length} productos`);    
                PageAlta.renderTemplateTable(products);
        
                PageAlta.emptyForm();
            }
        });

        PageAlta.btnUpdate.addEventListener('click', async e => {
            console.error('btn-update');
            const productToSave = PageAlta.validateForm(PageAlta.validators);
            if (productToSave) {
                const updatedProduct = await PageAlta.updateProduct(productToSave);
                console.log('updatedProduct:', updatedProduct);
                if (PageAlta.objectIsEmpty(updatedProduct)) {
                    console.error('No se pudo guardar el producto');
                    return;
                }
                const products = await productController.getProducts();
                console.log(`Ahora hay ${products.length} productos`);    
                PageAlta.renderTemplateTable(products);        
                PageAlta.emptyForm();
                PageAlta.prepareFormForCreating();
            }
        });
        
        PageAlta.btnCancel.addEventListener('click', e => {
            console.error('btn-cancel');

            PageAlta.emptyForm();
            PageAlta.prepareFormForCreating();
        });

    }

    static objectIsEmpty(object) {
        return Object.entries(object).length === 0;
    }

    static prepareForm() {
        PageAlta.productForm = document.querySelector('.form-container__form');
        PageAlta.fields = PageAlta.productForm.querySelectorAll('[name]');
        PageAlta.btnCreate = PageAlta.productForm.querySelector('.button--float-right');
        PageAlta.btnUpdate = PageAlta.productForm.querySelector('.button--modify');
        PageAlta.btnCancel = PageAlta.productForm.querySelector('.button--delete');
        PageAlta.addFormEvents();
    }




    static async init () {
        console.log('PageAlta.init()');

        PageAlta.prepareTable();
        PageAlta.prepareForm();
    }
}

export default PageAlta;



"use strict";

/// 1. Variables  ///

const mainForm = document.querySelector(".form-container__form");
const inputName = document.querySelector("#name");
const inputType = document.querySelector("#type");
const inputPrice = document.querySelector("#price");
const inputBrand = document.querySelector("#brand");
const inputShortDescription = document.querySelector("#short-description");
const inputLongDescription = document.querySelector("#long-description");
const inputMinAge = document.querySelector("#min-age");
const inputStock = document.querySelector("#stock");
const inputMaxAge = document.querySelector("#max-age");
const inputCategory = document.querySelector("#category");

/// 2.regExp  ///

const regExpProductName = new RegExp("^([0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\,\.\'\ \"\-\_\/]){3,30}$");
const regExpProductPrice = new RegExp("(.[0-9]{1,2})?");
const regExpProductBrand = new RegExp("^([0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\,\.\'\ \"\-\_\/]){3,40}$");
const regExpProductCategory = new RegExp("^([0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\,\.\'\ \"\-\_\/]){3,50}$");
const regExpShortDescription = new RegExp("^[0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\,\.\'\"\-\_\/]{0,79}$");
const regExpLongDescription = new RegExp("^[0-9a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\s\,\.\'\"\-\_\/]{0,1999}$");
const regExpAge = new RegExp("\d+");

// /// 3. Functions  ///

const validateInputAndShowMessageBox = (e, regExp, message) => {
    const errorMessageBox = `
    <div class="form-container__obligatory-field">
        <p class="form-container__field-text">Este campo es obligatorio.</p>
        <p class="form-container__field-text">${message}</p>
    </div>
    `;
    if (!regExp.test(e.target.value)) {
        e.target.style.backgroundColor = "#e56972";
        if (!e.target.nextElementSibling) {
            e.target.insertAdjacentHTML("afterend", errorMessageBox);
            setTimeout(() => {
                e.target.nextElementSibling.remove();
            }, 3000);
        }
    } else {
        e.target.style.backgroundColor = "#a8c695";
        if (e.target.nextElementSibling) {
            e.target.nextElementSibling.remove();
        }
    }
};

/// 4. Event Listeners  ///

mainForm.addEventListener("change", e => {
    if (e.target === inputType) {
        validateInputAndShowMessageBox(e, regExpProductCategory, "La categoría debe tener entre 3 y 50 caracteres.");
    }
});

mainForm.addEventListener("change", e => {
    if (e.target === inputName) {
        validateInputAndShowMessageBox(e, regExpProductName, "El nombre debe tener entre 3 y 30 caracteres.");
    }
});

mainForm.addEventListener("change", e => {
    if (e.target === inputPrice) {
        validateInputAndShowMessageBox(e, regExpProductPrice, "El precio debe tener entre 1 y 9 caracteres. Campo numérico positivo.");
    }
});

mainForm.addEventListener("change", e => {
    if (e.target === inputBrand) {
        validateInputAndShowMessageBox(e, regExpProductBrand, "La marca debe tener entre 3 y 40 caracteres.");
    }
});

mainForm.addEventListener("change", e => {
    if (e.target === inputShortDescription) {
        validateInputAndShowMessageBox(e, regExpAge, "La descripción corta debe tener entre 0 y 79 caracteres.");
    }
});

mainForm.addEventListener("change", e => {
    if (e.target === inputLongDescription) {
        validateInputAndShowMessageBox(e, regExpAge, "La descripción larga debe tener entre 0 y 1999 caracteres.");
    }
});

mainForm.addEventListener("change", e => {
    if (e.target === inputMinAge) {
        validateInputAndShowMessageBox(e, regExpShortDescription, "La edad mínima debe tener entre 0 y 2 caracteres.");
    }
});

mainForm.addEventListener("change", e => {
    if (e.target === inputMaxAge) {
        validateInputAndShowMessageBox(e, regExpLongDescription, "La edad máxima debe tener entre 0 y 2 caracteres.");
    }
});

mainForm.addEventListener("change", e => {
    if (e.target === inputCategory) {
        validateInputAndShowMessageBox(e, regExpProductCategory, "La categoría debe tener entre 3 y 50 caracteres.");
    }
});

mainForm.addEventListener("change", e => {
    if (e.target === inputStock) {
        validateInputAndShowMessageBox(e, regExpProductCategory, "La categoría debe tener entre 3 y 50 caracteres.");
    }
});