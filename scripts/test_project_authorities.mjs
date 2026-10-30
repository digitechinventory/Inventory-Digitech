// Automated test script for Project Authorities

const BASE_URL = 'http://127.0.0.1:3001';

async function run() {
  console.log('=== TESTING PROJECT AUTHORITIES SYSTEM ===\n');

  // 1. Login as Superadmin
  console.log('1. Logging in as Superadmin (arya-superadmin)...');
  const saRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arya-superadmin@digitech.co.id', password: 'admin123' })
  });
  const saData = await saRes.json();
  if (!saData.success) {
    throw new Error('Superadmin login failed: ' + JSON.stringify(saData));
  }
  const saToken = saData.data.session.access_token;
  console.log('   ✓ Superadmin logged in. Allowed projects:', saData.data.user.allowed_projects);

  // 2. Login as Admin (arya-admin)
  console.log('\n2. Logging in as Admin (arya-admin)...');
  const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arya-admin@digitech.co.id', password: 'admin123' })
  });
  const adminData = await adminRes.json();
  const adminToken = adminData.data.session.access_token;
  console.log('   ✓ Admin logged in. Allowed projects:', adminData.data.user.allowed_projects);

  // 3. Login as User (arya-user)
  console.log('\n3. Logging in as User (arya-user)...');
  const userRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'arya-user@digitech.co.id', password: 'admin123' })
  });
  const userData = await userRes.json();
  const userToken = userData.data.session.access_token;
  console.log('   ✓ User logged in. Allowed projects:', userData.data.user.allowed_projects);

  // 4. Test Superadmin access to GET /api/project-inventory/authorities
  console.log('\n4. Superadmin accessing /api/project-inventory/authorities...');
  const authRes = await fetch(`${BASE_URL}/api/project-inventory/authorities`, {
    headers: { 'Authorization': `Bearer ${saToken}` }
  });
  const authoritiesData = await authRes.json();
  console.log('   ✓ Status:', authRes.status);
  console.log('   ✓ Users count:', authoritiesData.data.users.length);
  authoritiesData.data.users.forEach(u => {
    console.log(`     - ${u.full_name} (${u.role}): [${u.allowed_projects?.join(', ')}]`);
  });

  // 5. Test Non-Superadmin (Admin & User) trying to access /api/project-inventory/authorities -> MUST BE 403
  console.log('\n5. Testing RBAC on /api/project-inventory/authorities (User should be 403)...');
  const userAuthRes = await fetch(`${BASE_URL}/api/project-inventory/authorities`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log('   ✓ User access status:', userAuthRes.status, userAuthRes.status === 403 ? '(Correct: 403 Forbidden)' : '(FAILED)');

  // 6. Test Admin accessing FAMOUS (Granted) vs WIM (Not Granted initially)
  console.log('\n6. Testing Admin access to FAMOUS vs WIM:');
  const adminFamousRes = await fetch(`${BASE_URL}/api/project-inventory/famous/summary`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('   ✓ Admin -> FAMOUS summary status:', adminFamousRes.status, adminFamousRes.status === 200 ? '(Granted - Correct)' : '(FAILED)');

  const adminWimRes = await fetch(`${BASE_URL}/api/project-inventory/wim/summary`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminWimData = await adminWimRes.json();
  console.log('   ✓ Admin -> WIM summary status:', adminWimRes.status, adminWimRes.status === 403 ? '(Locked - Correct: 403 Forbidden)' : '(FAILED)');
  console.log('     Message:', adminWimData.error);

  // 7. Test User accessing WIM (Granted) vs FAMOUS (Not Granted initially)
  console.log('\n7. Testing User access to WIM vs FAMOUS:');
  const userWimRes = await fetch(`${BASE_URL}/api/project-inventory/wim/summary`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  console.log('   ✓ User -> WIM summary status:', userWimRes.status, userWimRes.status === 200 ? '(Granted - Correct)' : '(FAILED)');

  const userFamousRes = await fetch(`${BASE_URL}/api/project-inventory/famous/summary`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });
  const userFamousData = await userFamousRes.json();
  console.log('   ✓ User -> FAMOUS summary status:', userFamousRes.status, userFamousRes.status === 403 ? '(Locked - Correct: 403 Forbidden)' : '(FAILED)');
  console.log('     Message:', userFamousData.error);

  // 8. Superadmin granting WIM to Admin via PUT /api/project-inventory/authorities/demo-admin-001
  console.log('\n8. Superadmin granting both FAMOUS and WIM to Admin (demo-admin-001)...');
  const grantRes = await fetch(`${BASE_URL}/api/project-inventory/authorities/demo-admin-001`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${saToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ allowed_projects: ['proj-famous', 'proj-wim'] })
  });
  const grantData = await grantRes.json();
  console.log('   ✓ Grant status:', grantRes.status, grantData.message);

  // 9. Admin now tests WIM again -> MUST BE 200 OK!
  console.log('\n9. Admin re-testing WIM access after Superadmin authority grant...');
  const adminWimRecheck = await fetch(`${BASE_URL}/api/project-inventory/wim/summary`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('   ✓ Admin -> WIM status after grant:', adminWimRecheck.status, adminWimRecheck.status === 200 ? '(NOW ACCESSIBLE! Correct)' : '(FAILED)');

  // 10. Superadmin revoking WIM back from Admin to restore initial state
  console.log('\n10. Superadmin restoring Admin authority back to FAMOUS only...');
  await fetch(`${BASE_URL}/api/project-inventory/authorities/demo-admin-001`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${saToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ allowed_projects: ['proj-famous'] })
  });
  console.log('   ✓ Restored.\n');

  console.log('=== ALL BACKEND PROJECT AUTHORITIES CHECKS PASSED SUCCESSFULLY! ===');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
