const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzGMMo8mE7_RXEDMnZ-glfmH9kqd4rMm-FMNAIUlZYX4oHTMLKXx6A1dsPImA08KqoNAw/exec";

// قائمة الـ 15 يوماً المحددة جاهزة ومباشرة
const daysList = [
    "اليوم 1 (الجمعة 7 أغسطس)",
    "اليوم 2 (السبت 8 أغسطس)",
    "اليوم 3 (الأحد 9 أغسطس)",
    "اليوم 4 (الإثنين 10 أغسطس)",
    "اليوم 5 (الثلاثاء 11 أغسطس)",
    "اليوم 6 (الأربعاء 12 أغسطس)",
    "اليوم 7 (الخميس 13 أغسطس)",
    "اليوم 8 (الجمعة 14 أغسطس)",
    "اليوم 9 (السبت 15 أغسطس)",
    "اليوم 10 (الأحد 16 أغسطس)",
    "اليوم 11 (الإثنين 17 أغسطس)",
    "اليوم 12 (الثلاثاء 18 أغسطس)",
    "اليوم 13 (الأربعاء 19 أغسطس)",
    "اليوم 14 (الخميس 20 أغسطس)",
    "اليوم 15 (الجمعة 21 أغسطس)"
];

function initForm() {
    const dateSelect = document.getElementById('date-select');
    if (!dateSelect) return;
    
    dateSelect.innerHTML = '<option value="" disabled selected>اختر اليوم...</option>';

    daysList.forEach((dayText) => {
        const option = document.createElement('option');
        option.value = dayText;
        option.innerText = dayText;
        dateSelect.appendChild(option);
    });
}

// تشغيل الدالة فور تحميل الملف
document.addEventListener('DOMContentLoaded', initForm);
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
