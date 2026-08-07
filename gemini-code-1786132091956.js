const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzGMMo8mE7_RXEDMnZ-glfmH9kqd4rMm-FMNAIUlZYX4oHTMLKXx6A1dsPImA08KqoNAw/exec";

const startDate = new Date('2026-08-07');
const totalDays = 15;

function initForm() {
    const dateSelect = document.getElementById('date-select');
    dateSelect.innerHTML = '<option value="" disabled selected>اختر اليوم...</option>';

    for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayLabel = currentDate.toLocaleDateString('ar-EG', { weekday: 'long', month: 'short', day: 'numeric' });

        const option = document.createElement('option');
        option.value = `اليوم ${i + 1} (${dayLabel})`;
        option.innerText = `اليوم ${i + 1} (${dayLabel})`;
        dateSelect.appendChild(option);
    }
}

initForm();

function toggleIdeaBox(show) {
    const container = document.getElementById('idea-container');
    const textarea = document.getElementById('idea-text');
    if (show) {
        container.classList.remove('hidden');
        textarea.required = true;
    } else {
        container.classList.add('hidden');
        textarea.required = false;
        textarea.value = '';
    }
}

function handleSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    submitBtn.innerText = "جاري الإرسال لجوجل شيت...";
    submitBtn.disabled = true;

    const formData = {
        name: document.getElementById('servant-name').value.trim(),
        family: document.getElementById('family-select').value,
        date: document.getElementById('date-select').value,
        hasIdea: document.querySelector('input[name="has-idea"]:checked')?.value === 'yes',
        ideaText: document.getElementById('idea-text').value.trim(),
        adminNotes: document.getElementById('admin-notes').value.trim()
    };

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(() => {
        showThankYou();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('حدث خطأ في الاتصال، حاول ثانية.');
        submitBtn.innerText = "إرسال التسجيل";
        submitBtn.disabled = false;
    });
}

function showThankYou() {
    document.getElementById('form-card').classList.add('hidden');
    document.getElementById('thankyou-card').classList.remove('hidden');
}

function resetForm() {
    document.getElementById('servant-form').reset();
    toggleIdeaBox(false);
    document.getElementById('submit-btn').innerText = "إرسال التسجيل";
    document.getElementById('submit-btn').disabled = false;

    document.getElementById('thankyou-card').classList.add('hidden');
    document.getElementById('form-card').classList.remove('hidden');
}
