const modes = {
  of: {
    fields: [
      { id: 'percent', label: 'Percentage', placeholder: '20', suffix: '%' },
      { id: 'number', label: 'Number', placeholder: '250' }
    ],
    calculate: ({ percent, number }) => ({
      value: (percent / 100) * number,
      detail: `${formatNumber(percent)}% of ${formatNumber(number)}`
    })
  },
  whatPercent: {
    fields: [
      { id: 'part', label: 'First number', placeholder: '50' },
      { id: 'whole', label: 'Second number', placeholder: '250' }
    ],
    calculate: ({ part, whole }) => {
      if (whole === 0) throw new Error('The second number cannot be zero.');
      return {
        value: (part / whole) * 100,
        suffix: '%',
        detail: `${formatNumber(part)} is this percentage of ${formatNumber(whole)}`
      };
    }
  },
  change: {
    fields: [
      { id: 'oldValue', label: 'Old value', placeholder: '100' },
      { id: 'newValue', label: 'New value', placeholder: '125' }
    ],
    calculate: ({ oldValue, newValue }) => {
      if (oldValue === 0) throw new Error('The old value cannot be zero.');
      const change = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
      const direction = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'no change';
      return {
        value: Math.abs(change),
        suffix: '%',
        detail: change === 0 ? 'There is no percentage change.' : `${formatNumber(Math.abs(change))}% ${direction}`
      };
    }
  },
  discount: {
    fields: [
      { id: 'price', label: 'Original price', placeholder: '120' },
      { id: 'discount', label: 'Discount', placeholder: '25', suffix: '%' }
    ],
    calculate: ({ price, discount }) => {
      if (price < 0) throw new Error('Price cannot be negative.');
      if (discount < 0 || discount > 100) throw new Error('Discount must be between 0 and 100.');
      const savings = price * (discount / 100);
      return {
        value: price - savings,
        detail: `You save ${formatNumber(savings)} from the original price.`
      };
    }
  }
};

const modeButtons = [...document.querySelectorAll('.mode-btn')];
const form = document.getElementById('calculator-form');
const fieldsContainer = document.getElementById('fields');
const errorMessage = document.getElementById('form-error');
const resultPanel = document.getElementById('result');
const resultValue = document.getElementById('result-value');
const resultDetail = document.getElementById('result-detail');

let activeMode = 'of';

function init() {
  renderFields();
  modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  form.addEventListener('submit', handleSubmit);
}

function setMode(mode) {
  if (!modes[mode]) return;
  activeMode = mode;
  modeButtons.forEach(button => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });
  clearFeedback();
  renderFields();
  const firstInput = fieldsContainer.querySelector('input');
  firstInput?.focus();
}

function renderFields() {
  fieldsContainer.replaceChildren();

  modes[activeMode].fields.forEach(field => {
    const wrapper = document.createElement('div');
    wrapper.className = 'field';

    const label = document.createElement('label');
    label.htmlFor = field.id;
    label.textContent = field.label;

    const input = document.createElement('input');
    input.id = field.id;
    input.name = field.id;
    input.type = 'number';
    input.inputMode = 'decimal';
    input.step = 'any';
    input.placeholder = field.placeholder;
    input.autocomplete = 'off';
    input.required = true;

    wrapper.append(label, input);

    if (field.suffix) {
      const hint = document.createElement('span');
      hint.className = 'field-hint';
      hint.textContent = `Enter a value in ${field.suffix === '%' ? 'percent' : field.suffix}`;
      wrapper.append(hint);
    }

    fieldsContainer.append(wrapper);
  });
}

function handleSubmit(event) {
  event.preventDefault();
  errorMessage.textContent = '';

  const values = {};
  const inputs = [...fieldsContainer.querySelectorAll('input')];

  for (const input of inputs) {
    if (input.value.trim() === '') {
      showError('Please enter all values.');
      input.focus();
      return;
    }

    const value = Number(input.value);
    if (!Number.isFinite(value)) {
      showError('Please enter valid numbers.');
      input.focus();
      return;
    }
    values[input.name] = value;
  }

  try {
    const result = modes[activeMode].calculate(values);
    resultValue.textContent = `${formatNumber(result.value)}${result.suffix || ''}`;
    resultDetail.textContent = result.detail;
    resultPanel.hidden = false;
    resultPanel.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  } catch (error) {
    showError(error.message || 'Unable to calculate. Check your values.');
  }
}

function showError(message) {
  errorMessage.textContent = message;
  resultPanel.hidden = true;
}

function clearFeedback() {
  errorMessage.textContent = '';
  resultPanel.hidden = true;
  resultValue.textContent = '0';
  resultDetail.textContent = '';
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.abs(value) < 1e-12 ? 0 : value;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6
  }).format(rounded);
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

init();
