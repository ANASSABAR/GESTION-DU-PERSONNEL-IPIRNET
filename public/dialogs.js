/* dialogs.js - Custom IPIRNET Modals replacing native browser dialogs */

(function() {
    // Create the overlay container if it doesn't exist
    function getDialogOverlay() {
        let overlay = document.getElementById('ipirnet-dialog-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ipirnet-dialog-overlay';
            overlay.className = 'ipirnet-dialog-overlay';
            
            const html = `
                <div class="ipirnet-dialog-box">
                    <div class="ipirnet-dialog-header">
                        <img src="/assets/logo-ipirnet.png" alt="IPIRNET" class="ipirnet-dialog-logo">
                        <h3 class="ipirnet-dialog-title">IPIRNET Gestion du Personnel</h3>
                    </div>
                    <div class="ipirnet-dialog-body" id="ipirnet-dialog-msg"></div>
                    <div class="ipirnet-dialog-footer" id="ipirnet-dialog-buttons">
                        <!-- Buttons will be injected here -->
                    </div>
                </div>
            `;
            overlay.innerHTML = html;
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    function showDialog(message, type = 'alert', resolveCb) {
        const overlay = getDialogOverlay();
        const msgEl = document.getElementById('ipirnet-dialog-msg');
        const btnsEl = document.getElementById('ipirnet-dialog-buttons');
        
        msgEl.textContent = message;
        btnsEl.innerHTML = '';
        
        if (type === 'confirm') {
            const btnCancel = document.createElement('button');
            btnCancel.className = 'ipirnet-dialog-btn ipirnet-dialog-btn-cancel';
            btnCancel.textContent = 'Annuler';
            
            const btnConfirm = document.createElement('button');
            btnConfirm.className = 'ipirnet-dialog-btn ipirnet-dialog-btn-danger';
            btnConfirm.textContent = 'Confirmer';
            
            btnCancel.onclick = () => {
                closeDialog(overlay);
                resolveCb(false);
            };
            btnConfirm.onclick = () => {
                closeDialog(overlay);
                resolveCb(true);
            };
            
            btnsEl.appendChild(btnCancel);
            btnsEl.appendChild(btnConfirm);
        } else {
            const btnOk = document.createElement('button');
            btnOk.className = 'ipirnet-dialog-btn ipirnet-dialog-btn-confirm';
            btnOk.textContent = 'OK';
            
            btnOk.onclick = () => {
                closeDialog(overlay);
                resolveCb(true);
            };
            
            btnsEl.appendChild(btnOk);
        }
        
        // Use requestAnimationFrame to ensure the display change takes effect before adding the class
        overlay.style.display = 'flex';
        requestAnimationFrame(() => {
            overlay.classList.add('active');
        });
    }

    function closeDialog(overlay) {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300); // Wait for transition
    }

    // Expose global functions
    window.ipirnetAlert = function(message) {
        return new Promise(resolve => {
            showDialog(message, 'alert', resolve);
        });
    };

    window.ipirnetConfirm = function(message) {
        return new Promise(resolve => {
            showDialog(message, 'confirm', resolve);
        });
    };
})();
