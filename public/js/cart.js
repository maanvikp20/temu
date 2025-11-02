// cart.js - Add to Cart Functionality

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Cart.js loaded');
  
  // Add event delegation for dynamically loaded content
  document.body.addEventListener('click', function(e) {
    // Check if clicked element or its parent is the add-to-cart button
    const button = e.target.closest('.add-to-cart-btn');
    
    if (button) {
      e.preventDefault();
      console.log('Add to cart button clicked');
      
      const productId = button.getAttribute('data-product-id');
      console.log('Product ID:', productId);
      
      if (!productId) {
        console.error('No product ID found');
        return;
      }
      
      // Disable button temporarily to prevent double clicks
      button.disabled = true;
      const originalContent = button.innerHTML;
      
      // Show loading state
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke="#333" stroke-width="2" stroke-dasharray="60" stroke-dashoffset="60" opacity="0.3">
            <animate attributeName="stroke-dashoffset" values="60;0" dur="1s" repeatCount="indefinite" />
          </circle>
        </svg>
      `;
      
      // Send request to add item to cart
      fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: productId })
      })
      .then(response => {
        console.log('Response status:', response.status);
        return response.json();
      })
      .then(data => {
        console.log('Response data:', data);
        
        if (data.success) {
          // Show success animation
          button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 13l4 4L19 7" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
          
          // Update cart count in header
          updateCartCount(data.cartCount);
          
          // Add success animation to card
          const productCard = button.closest('.product-card');
          if (productCard) {
            productCard.style.animation = 'cardSuccess 0.3s ease';
          }
          
          // Show toast notification
          showToast('✓ Added to cart!', 'success');
          
          // Reset button after 1 second
          setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
            if (productCard) {
              productCard.style.animation = '';
            }
          }, 1000);
          
        } else {
          // Show error
          console.error('Failed to add to cart:', data.message);
          showToast('✗ ' + data.message, 'error');
          button.innerHTML = originalContent;
          button.disabled = false;
        }
      })
      .catch(error => {
        console.error('Fetch error:', error);
        showToast('✗ Failed to add to cart', 'error');
        button.innerHTML = originalContent;
        button.disabled = false;
      });
    }
  });
  
  // Function to update cart count in header
  function updateCartCount(count) {
    console.log('Updating cart count to:', count);
    const cartCountElements = document.querySelectorAll('.cart-count, .cart-badge, [data-cart-count]');
    
    if (cartCountElements.length === 0) {
      console.warn('No cart count elements found');
    }
    
    cartCountElements.forEach(element => {
      element.textContent = count;
      
      // Show/hide badge based on count
      if (count > 0) {
        element.style.display = 'flex';
      } else {
        element.style.display = 'none';
      }
      
      // Add bounce animation
      element.style.animation = 'cartBounce 0.5s ease';
      setTimeout(() => {
        element.style.animation = '';
      }, 500);
    });
  }
  
  // Function to show toast notification
  function showToast(message, type = 'success') {
    console.log('Showing toast:', message, type);
    
    // Remove existing toasts
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;
    
    // Add toast styles
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: ${type === 'success' ? '#22c55e' : '#ef4444'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      animation: slideInRight 0.3s ease;
      font-size: 14px;
      font-weight: 500;
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // Add CSS animations dynamically if not in stylesheet
  if (!document.querySelector('#cart-animations')) {
    const style = document.createElement('style');
    style.id = 'cart-animations';
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
      
      @keyframes cartBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
      }
      
      @keyframes cardSuccess {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(0.98); }
      }
    `;
    document.head.appendChild(style);
  }
  
});

// Cart page functionality
if (window.location.pathname === '/cart') {
  
  document.addEventListener('DOMContentLoaded', function() {
    
    // Increase quantity
    document.addEventListener('click', function(e) {
      const increaseBtn = e.target.closest('.increase-qty');
      if (increaseBtn) {
        const productId = increaseBtn.getAttribute('data-product-id');
        const input = document.querySelector(`.qty-input[data-product-id="${productId}"]`);
        const currentQty = parseInt(input.value);
        updateCartQuantity(productId, currentQty + 1);
      }
    });
    
    // Decrease quantity
    document.addEventListener('click', function(e) {
      const decreaseBtn = e.target.closest('.decrease-qty');
      if (decreaseBtn) {
        const productId = decreaseBtn.getAttribute('data-product-id');
        const input = document.querySelector(`.qty-input[data-product-id="${productId}"]`);
        const currentQty = parseInt(input.value);
        if (currentQty > 1) {
          updateCartQuantity(productId, currentQty - 1);
        } else {
          // If quantity is 1 and user clicks decrease, remove the item
          removeFromCart(productId);
        }
      }
    });
    
    // Remove item (no confirmation)
    document.addEventListener('click', function(e) {
      const removeBtn = e.target.closest('.remove-item-btn');
      if (removeBtn) {
        const productId = removeBtn.getAttribute('data-product-id');
        removeFromCart(productId);
      }
    });
    
    // Clear cart (no confirmation)
    const clearCartBtn = document.querySelector('.clear-cart-btn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', function() {
        clearCart();
      });
    }
    
    function updateCartQuantity(productId, quantity) {
      fetch('/api/cart/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          location.reload();
        }
      })
      .catch(error => console.error('Error:', error));
    }
    
    function removeFromCart(productId) {
      fetch('/api/cart/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          location.reload();
        }
      })
      .catch(error => console.error('Error:', error));
    }
    
    function clearCart() {
      fetch('/api/cart/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          location.reload();
        }
      })
      .catch(error => console.error('Error:', error));
    }
    
  });
}