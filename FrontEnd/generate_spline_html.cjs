const fs = require('fs');
const path = require('path');

async function main() {
  const res = await fetch('https://my.spline.design/nexbotrobotcharacterconcept-Od5WflpjroNUX6I1cGMg9fvj/');
  let html = await res.text();

  // Add importmap in head
  const importMap = `
		<script type="importmap">
		{
			"imports": {
				"three": "https://unpkg.com/three@0.160.0/build/three.module.js",
				"three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
			}
		}
		</script>
	`;
  html = html.replace('</head>', importMap + '\n\t</head>');

  // Replace script imports
  html = html.replace(
    "import { Application } from 'https://unpkg.com/@splinetool/runtime@1.12.98/build/runtime.js';",
    `import * as THREE from 'three';
			import { FontLoader } from 'three/addons/loaders/FontLoader.js';
			import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
			import { Application } from 'https://unpkg.com/@splinetool/runtime@1.12.98/build/runtime.js';
			window.__THREE__ = THREE;`
  );

  // Replace onLoad in script with True 3D TextGeometry
  const customOnLoad = `
			const onLoad = () => {
				console.log('Spline loaded, replacing NEXBOT 3D shapes with DIGITECH 3D text...');
				window.__splineApp = app;
				if (app && app._scene) {
					window.__splineScene = app._scene;

					let logo = null;
					let shapeMat = null;

					app._scene.traverse((obj) => {
						const name = (obj.name || '').toLowerCase();
						if (name === 'logo') {
							logo = obj;
						}
						if (name === 'bot') {
							obj.visible = true;
						}
						if (obj.name === 'Shape 0' && obj.material && !shapeMat) {
							shapeMat = obj.material;
						}
					});

					if (logo) {
						// Hide original NEXBOT shapes
						logo.children.forEach((c) => {
							if (c.name.startsWith('Shape')) {
								c.visible = false;
							}
						});
						logo.visible = true;

						// If already created, don't duplicate
						if (logo.getObjectByName('DIGITECH_3D_TEXT')) {
							return;
						}

						// Load local bold font
						const fontLoader = new FontLoader();
						fontLoader.load('/fonts/helvetiker_bold.typeface.json', (font) => {
							console.log('3D Font loaded, generating DIGITECH TextGeometry...');
							const textGeo = new TextGeometry('DIGITECH', {
								font: font,
								size: 440,
								height: 100,
								curveSegments: 8,
								bevelEnabled: true,
								bevelThickness: 15,
								bevelSize: 10,
								bevelOffset: 0,
								bevelSegments: 4
							});
							textGeo.center();

							const textMesh = new THREE.Mesh(textGeo, shapeMat);
							textMesh.name = 'DIGITECH_3D_TEXT';
							textMesh.position.set(0, 220, 0); // Exact vertical position of original NEXBOT
							logo.add(textMesh);
							console.log('DIGITECH 3D text mesh successfully added into scene!');
						}, undefined, (err) => {
							console.error('Error loading 3D font:', err);
						});
					}
				}
			};
`;

  html = html.replace(/const onLoad = \(\) => {[\s\S]*?}(?=\s*app\.start)/, customOnLoad.trim());

  html = html.replace(
    /app\.start\(/,
    'app.addEventListener && app.addEventListener("load", onLoad);\n\t\t\tapp.start('
  );

  html = html.replace(
    /app\.start\(([\s\S]*?)\);?(?=\s*<\/script>)/,
    'app.start($1).then(() => { console.log("app.start completed!"); if (typeof onLoad === "function") onLoad(); }).catch(console.error);'
  );

  const outPath = path.join(__dirname, 'public', 'spline-robot.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('Successfully updated', outPath);
}

main().catch(console.error);
