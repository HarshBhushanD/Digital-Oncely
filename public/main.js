document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email-input');
    const submitBtn = document.getElementById('submit-btn');
    const subscriberCountElement = document.getElementById('subscriber-count');
    const successModal = document.getElementById('success-modal');
    const errorModal = document.getElementById('error-modal');
    const errorTitle = document.getElementById('error-title');
    const errorMessage = document.getElementById('error-message');
    const closeButtons = document.querySelectorAll('.close-button');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            successModal.style.display = 'none';
            errorModal.style.display = 'none';
        });
    });
    
    
    window.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.style.display = 'none';
        }
        if (e.target === errorModal) {
            errorModal.style.display = 'none';
        }
    });
    
    const fetchSubscriberCount = async () => {
        try {
            const response = await fetch('https://ltqlisa626.execute-api.us-east-2.amazonaws.com/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task: 'fetch',
                    action: 'subscriber_count'
                })
            });
            const data = await response.json();
            if (data.count) {
                animateCount(data.count);
            }
        } catch (error) {
            console.error('Error fetching subscriber count:', error);
        }
    };
    
    const animateCount = (finalCount) => {
        let currentCount = finalCount - Math.floor(Math.random() * 50) - 10;
        
        const interval = setInterval(() => {
            currentCount += Math.floor(Math.random() * 3) + 1;
            if (currentCount >= finalCount) {
                currentCount = finalCount;
                clearInterval(interval);
            }
            subscriberCountElement.textContent = currentCount.toLocaleString();
        }, 200);
    };
   
const generateRandomCode = () => {
   
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let couponCode = '';
    
    for (let i = 0; i < 8; i++) {
        couponCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return couponCode;
};

const showSuccess = () => {
    const randomCode = generateRandomCode();
    
    discountCode.textContent = randomCode;
    
    localStorage.setItem('discountCode', randomCode);
    
    saveDiscountCode(emailInput.value, randomCode);
    
    successModal.style.display = 'flex';
};

const saveDiscountCode = async (email, code) => {
    try {
        await fetch('https://ltqlisa626.execute-api.us-east-2.amazonaws.com/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                task: 'save_discount',
                email,
                discountCode: code
            })
        });
    } catch (error) {
        console.error('Error saving discount code:', error);
    }
};
    
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        if (!email || !validateEmail(email)) {
            showError('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        
        try {
            submitBtn.textContent = 'Joining...';
            submitBtn.disabled = true;
            
            const response = await fetch('https://ltqlisa626.execute-api.us-east-2.amazonaws.com/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task: 'subscribe',
                    email
                })
            });
            
            const data = await response.json();
            
            submitBtn.textContent = 'Join Free →';
            submitBtn.disabled = false;
            
            if (response.ok) {
                emailInput.value = '';
                showSuccess();
            } else {
                showError('Subscription Failed', data.message || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            submitBtn.textContent = 'Join Free →';
            submitBtn.disabled = false;
            showError('Connection Error', 'Unable to connect to the server. Please try again later.');
            console.error('Subscription error:', error);
        }
    });
    
    const validateEmail = (email) => {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };
    
    const showError = (title, message) => {
        errorTitle.textContent = title;
        errorMessage.textContent = message;
        errorModal.style.display = 'flex';
    };
    
    fetchSubscriberCount();
});
