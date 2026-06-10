const OVERLAY_ID = 'skipper-overlay-div';

function getFastForwardingText() {
  return Math.floor(Math.random() * 10) === 0
    ? 'buymeacoffee.com/soleh'
    : 'Fast forwarding the promo...';
}

export function attachFastForwardingText(videoPlayer) {
  if (document.getElementById(OVERLAY_ID) || !videoPlayer) return;

  const videoRect = videoPlayer.getBoundingClientRect();
  const centerX = videoRect.left + videoRect.width / 2;
  const centerY = videoRect.top + videoRect.height / 2;

  const overlayDiv = document.createElement('div');
  overlayDiv.id = OVERLAY_ID;
  overlayDiv.style.cssText = [
    'position:absolute',
    `top:${centerY}px`,
    `left:${centerX}px`,
    'transform:translate(-50%,-50%)',
    'background:rgba(255,255,255,0.7)',
    'display:flex',
    'justify-content:center',
    'align-items:center',
    'z-index:9999',
    'pointer-events:none',
  ].join(';');

  const textElement = document.createElement('p');
  textElement.textContent = getFastForwardingText();
  textElement.style.cssText = 'font-size:28px;font-weight:bold;margin:0';
  overlayDiv.appendChild(textElement);
  document.body.appendChild(overlayDiv);
}

export function removeFastForwardingText() {
  document.getElementById(OVERLAY_ID)?.remove();
}
