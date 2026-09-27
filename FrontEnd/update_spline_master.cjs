const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'spline-robot.html');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add CSS for #cyber-dots-canvas if not present
if (!content.includes('#cyber-dots-canvas')) {
  const cssTarget = '</style>';
  const cssCode = `
			#cyber-dots-canvas {
				position: absolute;
				inset: 0;
				width: 100%;
				height: 100%;
				pointer-events: none;
				z-index: 5;
				mix-blend-mode: screen;
			}
		</style>`;
  content = content.replace(cssTarget, cssCode);
}

// 2. Add <canvas id="cyber-dots-canvas"></canvas> after canvas3d if not present
if (!content.includes('id="cyber-dots-canvas"')) {
  content = content.replace(
    '<canvas id="canvas3d"></canvas>',
    '<canvas id="canvas3d"></canvas>\n\t\t<canvas id="cyber-dots-canvas"></canvas>'
  );
}

// 3. Replace the script section before app.start([
let p1 = content.indexOf('let isConfigured = false;');
if (p1 === -1) {
  p1 = content.indexOf('// ────── 1. INTERACTIVE CYBER DOT GRID CANVAS');
}
const p2 = content.indexOf('app.start([');

if (p1 === -1 || p2 === -1) {
  console.error('Could not find markers p1 or p2 in spline-robot.html');
  process.exit(1);
}

const newScript = `// ────── 1. INTERACTIVE CYBER DOT GRID CANVAS (RED / CYAN PARTICLES) ──────
			const dotCanvas = document.getElementById('cyber-dots-canvas');
			const dotCtx = dotCanvas ? dotCanvas.getContext('2d') : null;

			function resizeDotCanvas() {
				if (!dotCanvas) return;
				const dpr = window.devicePixelRatio || 1;
				dotCanvas.width = window.innerWidth * dpr;
				dotCanvas.height = window.innerHeight * dpr;
				if (dotCtx) {
					dotCtx.setTransform(1, 0, 0, 1, 0, 0);
					dotCtx.scale(dpr, dpr);
				}
			}
			window.addEventListener('resize', resizeDotCanvas);
			resizeDotCanvas();

			const cols = 55;
			const rows = 34;

			const mousePos = {
				x: window.innerWidth / 2,
				y: window.innerHeight / 2,
				targetX: window.innerWidth / 2,
				targetY: window.innerHeight / 2
			};

			window.addEventListener('mousemove', (e) => {
				mousePos.targetX = e.clientX;
				mousePos.targetY = e.clientY;
			});

			window.addEventListener('message', (msg) => {
				if (msg.data && msg.data.type === 'PARENT_MOUSE_MOVE') {
					mousePos.targetX = msg.data.normX * window.innerWidth;
					mousePos.targetY = msg.data.normY * window.innerHeight;
				}
			});

			let gridTime = 0;
			const animateDotGrid = () => {
				requestAnimationFrame(animateDotGrid);
				if (!dotCtx) return;

				gridTime += 0.025;
				mousePos.x += (mousePos.targetX - mousePos.x) * 0.12;
				mousePos.y += (mousePos.targetY - mousePos.y) * 0.12;

				const w = window.innerWidth;
				const h = window.innerHeight;
				dotCtx.clearRect(0, 0, w, h);

				const spacingX = w / cols;
				const spacingY = h / rows;
				const cx = w / 2;
				const cy = h / 2;

				const influenceRadius = 240;

				for (let r = 0; r < rows; r++) {
					for (let c = 0; c < cols; c++) {
						const x = (c + 0.5) * spacingX;
						const y = (r + 0.5) * spacingY;

						// Mask center robot torso
						const distRobot = Math.hypot((x - cx) / (w * 0.15), (y - cy - h * 0.08) / (h * 0.32));
						if (distRobot < 1.0) continue;

						const dMouse = Math.hypot(x - mousePos.x, y - mousePos.y);

						let dotSize = 2.0;
						let rCol = 6, gCol = 182, bCol = 212, alpha = 0.28;

						if (dMouse < influenceRadius) {
							const factor = 1 - dMouse / influenceRadius;
							dotSize = 2.0 + factor * 5.5;

							// Morph to Radiant Crimson Red on cursor proximity!
							rCol = Math.round(6 + (239 - 6) * factor);
							gCol = Math.round(182 * (1 - factor * 0.85));
							bCol = Math.round(212 * (1 - factor * 0.85));
							alpha = 0.35 + factor * 0.65;

							// Glowing halo around active red dots
							if (factor > 0.4) {
								dotCtx.fillStyle = \`rgba(239, 68, 68, \${0.15 * factor})\`;
								dotCtx.beginPath();
								dotCtx.arc(x, y, dotSize * 2.2, 0, Math.PI * 2);
								dotCtx.fill();
							}
						} else {
							const wave = Math.sin(x * 0.008 + y * 0.008 + gridTime) * 0.5 + 0.5;
							alpha += wave * 0.12;
						}

						dotCtx.fillStyle = \`rgba(\${rCol}, \${gCol}, \${bCol}, \${alpha})\`;
						dotCtx.beginPath();
						dotCtx.arc(x, y, dotSize, 0, Math.PI * 2);
						dotCtx.fill();
					}
				}
			};
			animateDotGrid();

			// ────── 2. TOWERING 3D "DIGITECH" TYPOGRAPHY BEHIND ROBOT ──────
			let is3DConfigured = false;
			function tryConfigure3DText() {
				if (is3DConfigured) return true;
				if (!app || !app._scene) return false;

				let logoGroup = null;
				let shapeMat = null;

				app._scene.traverse((obj) => {
					const name = (obj.name || '').toLowerCase();
					if (name === 'logo') logoGroup = obj;
					if (obj.name === 'Shape 0' && obj.material && !shapeMat) {
						shapeMat = obj.material;
					}
				});

				if (!logoGroup || !shapeMat) return false;

				// Hide original NEXBOT shapes
				logoGroup.children.forEach((c) => {
					if (c.name && c.name.startsWith('Shape')) {
						c.visible = false;
					}
				});
				logoGroup.visible = true;

				if (logoGroup.getObjectByName('DIGITECH_3D_TEXT')) {
					is3DConfigured = true;
					return true;
				}

				const fontLoader = new FontLoader();
				fontLoader.load('/fonts/gentilis_bold.typeface.json', (font) => {
					console.log('3D Font loaded, generating towering DIGITECH 3D TextGeometry...');
					const textGeo = new TextGeometry('DIGITECH', {
						font: font,
						size: 480,
						height: 100,
						curveSegments: 6,
						bevelEnabled: true,
						bevelThickness: 15,
						bevelSize: 10,
						bevelOffset: 0,
						bevelSegments: 3
					});
					textGeo.center();

					const textMesh = new THREE.Mesh(textGeo, shapeMat);
					textMesh.name = 'DIGITECH_3D_TEXT';
					// Position in logo group space (logo pos is 0, 146, -1000, scale 0.3)
					// y: 500 places the giant text towering proudly across the upper background
					textMesh.position.set(0, 500, 0);
					textMesh.frustumCulled = false;

					logoGroup.add(textMesh);
					is3DConfigured = true;
					if (app.requestRender) app.requestRender();
					console.log('Towering DIGITECH 3D text rendered behind robot mascot!');
				}, undefined, (err) => {
					console.error('Error loading 3D font:', err);
				});

				return true;
			}

			app.addEventListener && app.addEventListener("load", tryConfigure3DText);
			const checkSceneInterval = setInterval(() => {
				if (tryConfigure3DText()) {
					clearInterval(checkSceneInterval);
				}
			}, 150);
			setTimeout(() => clearInterval(checkSceneInterval), 15000);

			`;

content = content.slice(0, p1) + newScript + content.slice(p2);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated public/spline-robot.html with DIGITECH 3D text and interactive cyber dot grid!');
