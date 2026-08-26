document.addEventListener('DOMContentLoaded', () => {
    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    copyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const codeEl = document.getElementById(targetId);
            
            navigator.clipboard.writeText(codeEl.innerText).then(() => {
                const originalText = btn.innerText;
                btn.innerText = 'COPIADO!';
                btn.style.backgroundColor = 'var(--pcb-trace-active)';
                btn.style.color = '#000';
                
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.backgroundColor = 'transparent';
                    btn.style.color = 'var(--pcb-trace-active)';
                }, 2000);
            });
        });
    });

    // Final Animation Logic
    const triggerBtn = document.getElementById('trigger-animation');
    const nodes = document.querySelectorAll('.node');
    const currents = document.querySelectorAll('.path-line .current');
    
    const ledColors = ['var(--led-blue)', 'var(--led-yellow)', 'var(--led-red)'];
    
    triggerBtn.addEventListener('click', () => {
        triggerBtn.disabled = true;
        triggerBtn.innerText = 'PROCESSANDO...';
        
        // Reset
        nodes.forEach(node => {
            node.style.borderColor = 'var(--pcb-trace)';
            node.style.color = '#888';
            node.style.boxShadow = 'none';
        });
        currents.forEach(c => {
            c.style.transition = 'none';
            c.style.opacity = '0';
            c.style.left = '-100%';
        });
        
        // Force reflow
        void triggerBtn.offsetWidth;

        let delay = 0;
        
        // Animate sequence
        for(let i=0; i<3; i++) {
            // Node lights up
            setTimeout(() => {
                nodes[i].style.borderColor = ledColors[i];
                nodes[i].style.color = '#fff';
                nodes[i].style.boxShadow = `0 0 15px ${ledColors[i]}`;
                nodes[i].style.background = '#222';
                
                // If there's a path after this node, animate current
                if (i < 2) {
                    currents[i].style.opacity = '1';
                    currents[i].style.transition = 'left 0.5s linear';
                    currents[i].style.left = '100%';
                }
                
                // Done
                if (i === 2) {
                    setTimeout(() => {
                        triggerBtn.innerText = 'SISTEMA ATIVADO!';
                        setTimeout(() => {
                            triggerBtn.disabled = false;
                            triggerBtn.innerText = 'TESTAR CIRCUITO COMPLETO';
                        }, 2000);
                    }, 500);
                }
            }, delay);
            
            delay += 600; // time between nodes
        }
    });
});
