export default class Select {
	constructor(options) {
		Object.assign(this._options = {}, this._default(), options);
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', () => {
				this._init();
			});
		} else {
			this._init();
		}
	}

	_template(data) {
		return `<div class="select">
					<div class="select__field ${data.currentOption.id ? '' : 'select__field_default'}">
						<div class="select__inner">
							<div class="select__option">
								<div class="select__text">${data.currentOption.id ? data.currentOption.name : data.placeholder}</div>
								<input class="select__input" type="text" placeholder="${data.placeholder}">
								<span class="select__toggle"></span>
							</div>
							<div class="select__dropdown">
								<div class="select__list">
								</div>
							</div>
						</div>
					</div>
					<div class="select__clear"></div>
				</div>`
	}

	_default() {
		return {
			el: '.index__select',
			list: [],
			placeholder: 'Введите текст',
			currentOption: {id: '', name: ''},
			closeDropdownOnEsc: true,
			closeDropdownOnBody: true,
			className: {
				wrap: 'select',
				field: 'select__field',
				list: 'select__list',
				input: 'select__input',
				text: 'select__text',
				clear: 'select__clear'
			},
			onSelectChange: function () {
			},
			onSelectClear: function () {
			}
		}
	}

	openDropdown() {
		document.querySelector(`${this._options.el} .${this._options.className.field}`).classList.add('select__field_open');
	}

	closeDropdown() {
		document.querySelector(`${this._options.el} .${this._options.className.field}`).classList.remove('select__field_open');
	}

	getCurrentOption() {
		return this._options.currentOption;
	}

	setOption(opt) {
		let list = this._options.list.filter((item) => {
			return item.name === opt.name && item.id === opt.id;
		});
		if ((Object.keys(opt).length === 0) || !opt.id || !opt.name) {
			throw new Error('Option is empty or invalid');
		} else if (list.length === 0) {
			throw new Error('Option not found in options array');
		} else {
			this._changeOptions(null, opt);
		}
	}

	clearSelect() {
		this._setDefault();
	}

	_setDefault() {
		document.querySelector(`${this._options.el} .${this._options.className.text}`).innerText = this._options.placeholder;
		document.querySelector(`${this._options.el} .${this._options.className.field}`).classList.add('select__field_default');

		document.querySelector(`${this._options.el} .${this._options.className.list}`).innerHTML = this._getOptionsTemplate();
		this._bindItemEvents();

		this._options.currentOption = {id: '', name: ''};
		if (this._options.onSelectClear && typeof this._options.onSelectClear === 'function') this._options.onSelectClear();
	}

	_changeOptions(e, opt = {}) {
		let oldOption = this._options.currentOption;
		if (e !== null) {
			this._options.currentOption = {id: e.target.dataset.id, name: e.target.innerText};
		} else {
			this._options.currentOption = opt;
		}
		document.querySelector(`${this._options.el} .${this._options.className.text}`).innerText = this._options.currentOption.name;
		document.querySelector(`${this._options.el} .${this._options.className.input}`).value = '';
		document.querySelector(`${this._options.el} .${this._options.className.field}`).classList.remove('select__field_default');
		this.closeDropdown();
		if (this._options.onSelectChange && typeof this._options.onSelectChange === 'function') this._options.onSelectChange(oldOption, this._options.currentOption);
	}

	_filterOptions(e) {
		let search = e.target.value;
		let list = this._options.list.filter((item) => {
			return item.name.toLowerCase().includes(search.toLowerCase());
		});
		if (list.length > 0) {
			document.querySelector(`${this._options.el} .${this._options.className.list}`).innerHTML = this._getOptionsTemplate(list);
			this._bindItemEvents();
		} else {
			document.querySelector(`${this._options.el} .${this._options.className.list}`).innerHTML = `<div class="select__no-result">Нет совпадений</div>`;
		}
	}

	_getOptionsTemplate(list) {
		list = list ? list : this._options.list;
		let html = '';
		for (let item of list) {
			html += `<div class="select__item" data-id="${item.id}">${item.name}</div>`;
		}
		return html;
	}

	_bindEvents() {
		document.querySelector(this._options.el).addEventListener('click', (e) => {
			if (e.target.classList.contains(this._options.className.clear)) {
				e.stopPropagation();
				this._setDefault();
			}
			if (e.target.classList.contains(this._options.className.input)) {
				e.stopPropagation();
				this.openDropdown();
			}
		});
		document.querySelector(`${this._options.el} .${this._options.className.input}`).addEventListener('keyup', this._filterOptions.bind(this));
	}

	_bindItemEvents() {
		Array.prototype.forEach.call(document.querySelectorAll(`${this._options.el} .${this._options.className.list} .select__item`), (el) => {
			el.addEventListener('click', this._changeOptions.bind(this));
		});
	}

	_init() {
		document.querySelector(this._options.el).innerHTML = this._template(this._options);
		document.querySelector(`${this._options.el} .${this._options.className.list}`).innerHTML = this._getOptionsTemplate();

		this._bindEvents();
		this._bindItemEvents();

		document.body.addEventListener('click', (e) => {
			if (this._options.closeDropdownOnBody && document.querySelector(`${this._options.el} .${this._options.className.field}`).classList.contains('select__field_open')) {
				this.closeDropdown();
			}
		});

		document.body.addEventListener('keyup', (e) => {
			if (this._options.closeDropdownOnEsc && e.keyCode === 27) {
				this.closeDropdown();
			}
		});
	}
}