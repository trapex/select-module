import style from "../css/style.scss";

if (process.env.NODE_ENV === 'development') {
	console.log('Working in development mode');
}

import countryJson from '../static/country.json';
import namesJson from '../static/names.json';
import Select from '../static/select.module/index'


if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		init();
	});
} else {
	init();
}

function init() {
	let select = new Select({
		el: '.index__select',
		list: countryJson,
		currentOption: {id: "50", name: "Дания"},
		onSelectChange: function (oldOption, newOption) {
			console.log(`oldOption: {id: ${oldOption.id}, name: ${oldOption.name}}`);
			console.log(`newOption: {id: ${newOption.id}, name: ${newOption.name}}`);
		},
		onSelectClear: function () {
			console.log('clear');
		}
	});

	document.querySelector('.index__clear').addEventListener('click', (e) => {
		select.clearSelect();
	});

	document.querySelector('.index__set').addEventListener('click', (e) => {
		let randomItem  = countryJson[Math.floor(Math.random()*countryJson.length)];
		select.setOption(randomItem);
	});

	document.querySelector('.index__error').addEventListener('click', (e) => {
		try {
			select.setOption({id: "", name: "Дания"});
		} catch (error) {
			alert(error.message);
		}
	});

	document.querySelector('.index__current').addEventListener('click', (e) => {
		let current = select.getCurrentOption();
		alert(`{id: ${current.id}, name: ${current.name}}`);
	});

	let select2 = new Select({
		el: '.index__select2',
		list: namesJson
	});
}