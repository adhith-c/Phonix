(
    () => {
        'use strict'

        const forms = document.querySelectorAll('.need-validation')

        Array.from(forms).forEach(element => {
            element.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }

                form.classList.add('was-validated')
            }, false)

        });
    }
)()