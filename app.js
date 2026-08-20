const modes = {
  of: {
    question: 'What is 20% of 250?',
    fields: [
      { id: 'percent', label: 'Percent', placeholder: '20' },
      { id: 'number', label: 'Number', placeholder: '250' }
    ],
    calculate: ({ percent, number }) => ({
      value: (percent / 100) * number,
      detail: `${formatNumber(percent)}% of ${formatNumber(number)}`
    })
  },
  whatPercent: {
    question: '50 is what percent of 250?',
    fields: [
      { id: 'part', label: 'First number', placeholder: '50' },
      { id: 'whole', label: 'Second number', placeholder: '250' }
    ],
    calculate: ({ part, whole }) => {
      if (whole === 0) throw new Error('Second number cannot be 0.');
      return {
        value: (part / whole) * 100,
        suffix: '%',
        detail: `${formatNumber(part)} out of ${formatNumber(whole)}`
      };
    }
  },
  change: {
    question: 'How much did the value change?',
    fields: [
      { id: 'oldValue', label: 'Old value', placeholder: '100' },
      { id: 'newValue', label: 'New value', placeholder: '125' }
    ],
    calculate: ({ oldValue, newValue }) => {
      if (oldValue === 0) throw new Error('Old value cannot be 0.');
      const change = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
      const direction = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'no change';
      return {
        value: Math.abs(change),
        suffix: '%',
        detail: direction
      };
    }
  },
  discount: {
    question: 'What is the price after discount?',
    fields: [
      { id: 'price', label: 'Price', placeholder: '120' },
      { id: 'discount', label: 'Discount %', placeholder: '25' }
    ],
    calculate: ({ price, discount }) => {
      if (price < 0) throw new Error('Price cannot be negative.');
      if (discount < 0 || discount > 100) throw new Error('Discount must be 0–100.');
      const savings = price * (discount / 100);
      return {
        value: price - savings,
        detail: `You save ${formatNumber(savings)}`
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
const modeQuestion = document.getElementById('mode-question');

let activeMode = 'of';

function init() {
  renderFields();
  updateQuestion();
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
  updateQuestion();
  renderFields();
}

function updateQuestion() {
  modeQuestion.textContent = modes[activeMode].question;
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
      showError('Enter both numbers.');
      input.focus();
      return;
    }

    const value = Number(input.value);
    if (!Number.isFinite(value)) {
      showError('Enter valid numbers.');
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
    showError(error.message || 'Check the numbers.');
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
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(rounded);
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

init();
