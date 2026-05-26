import assert from 'assert';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting WhisperWall Backend Integration Tests...\n');

  let roomId = '';
  let roomCode = '';

  // 1. Create Room Test
  try {
    console.log('1. Testing: Create Couple Room...');
    const res = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'couple' })
    });
    
    assert.strictEqual(res.status, 201, 'Room creation should return 201 Created');
    const data = await res.json();
    assert.ok(data.roomId, 'Should return roomId');
    assert.ok(data.code, 'Should return room code');
    assert.strictEqual(data.type, 'couple', 'Room type should be couple');
    
    roomId = data.roomId;
    roomCode = data.code;
    console.log(`✅ Room created successfully. Code: ${roomCode}, ID: ${roomId}\n`);
  } catch (error) {
    console.error('❌ Create Room Test Failed:', error.message);
    process.exit(1);
  }

  // 2. Join Room (User A - Creator) Test
  try {
    console.log('2. Testing: Join Room as User A...');
    const res = await fetch(`${BASE_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: roomCode,
        name: 'Alice',
        label: 'Partner A',
        device_id: 'device-alice-123'
      })
    });

    assert.strictEqual(res.status, 200, 'Joining should return 200 OK');
    const data = await res.json();
    assert.strictEqual(data.room.id, roomId, 'Joined room ID should match');
    assert.strictEqual(data.member.name, 'Alice', 'Member name should match');
    assert.strictEqual(data.members.length, 1, 'Should have 1 member now');
    console.log('✅ User A joined successfully.\n');
  } catch (error) {
    console.error('❌ Join User A Test Failed:', error.message);
    process.exit(1);
  }

  // 3. Rejoin Room (User A - Reconnection) Test
  try {
    console.log('3. Testing: Rejoin Room (User A reconnection with same device)...');
    const res = await fetch(`${BASE_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: roomCode,
        name: 'Alice Updated',
        label: 'Partner A Premium',
        device_id: 'device-alice-123'
      })
    });

    assert.strictEqual(res.status, 200, 'Rejoining should return 200 OK');
    const data = await res.json();
    assert.strictEqual(data.member.name, 'Alice Updated', 'Should allow updating name on reconnect');
    assert.strictEqual(data.members.length, 1, 'Members length should remain 1 (no duplicate)');
    console.log('✅ User A reconnected and updated successfully.\n');
  } catch (error) {
    console.error('❌ Rejoin User A Test Failed:', error.message);
    process.exit(1);
  }

  // 4. Join Room (User B - Partner) Test
  try {
    console.log('4. Testing: Join Room as User B...');
    const res = await fetch(`${BASE_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: roomCode,
        name: 'Bob',
        label: 'Partner B',
        device_id: 'device-bob-456'
      })
    });

    assert.strictEqual(res.status, 200, 'Joining should return 200 OK');
    const data = await res.json();
    assert.strictEqual(data.members.length, 2, 'Should have 2 members now');
    assert.ok(data.members.find(m => m.name === 'Bob'), 'Bob should be in members list');
    console.log('✅ User B joined successfully. Couple room is now fully paired.\n');
  } catch (error) {
    console.error('❌ Join User B Test Failed:', error.message);
    process.exit(1);
  }

  // 5. Couple Room Member Limit Test (Attempt Join User C)
  try {
    console.log('5. Testing: Join Room as User C (Should block since couple room limit is 2)...');
    const res = await fetch(`${BASE_URL}/api/rooms/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: roomCode,
        name: 'Charlie',
        label: 'Intruder',
        device_id: 'device-charlie-789'
      })
    });

    assert.strictEqual(res.status, 400, 'Joining full room should return 400 Bad Request');
    const data = await res.json();
    assert.ok(data.error.includes('full'), 'Error message should mention the room is full');
    console.log('✅ Charlie was blocked correctly. Room capacity limits work perfectly.\n');
  } catch (error) {
    console.error('❌ Capacity Limit Test Failed:', error.message);
    process.exit(1);
  }

  // 6. Set Wallpaper Test
  try {
    console.log('6. Testing: Set Wallpaper...');
    const res = await fetch(`${BASE_URL}/api/rooms/${roomId}/wallpaper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: '/uploads/mock_wallpaper.jpg',
        message: 'i love you to the moon and back',
        font: 'Dancing Script',
        color: '#FF6B8B',
        position: 'Bottom',
        set_by: 'Alice'
      })
    });

    assert.strictEqual(res.status, 200, 'Setting wallpaper should return 200 OK');
    const data = await res.json();
    assert.strictEqual(data.wallpaper.message, 'i love you to the moon and back', 'Wallpaper message should match');
    assert.strictEqual(data.wallpaper.image_url, '/uploads/mock_wallpaper.jpg', 'Image URL should match');
    assert.ok(data.wallpaper.expires_at, 'Should return expiration time');
    console.log('✅ Wallpaper updated successfully.\n');
  } catch (error) {
    console.error('❌ Set Wallpaper Test Failed:', error.message);
    process.exit(1);
  }

  // 7. Get Wallpaper Test
  try {
    console.log('7. Testing: Get Wallpaper...');
    const res = await fetch(`${BASE_URL}/api/rooms/${roomId}/wallpaper`);
    assert.strictEqual(res.status, 200, 'Get wallpaper should return 200 OK');
    
    const data = await res.json();
    assert.ok(data.wallpaper, 'Wallpaper should be present');
    assert.strictEqual(data.wallpaper.message, 'i love you to the moon and back', 'Retrieved message should match');
    console.log('✅ Wallpaper retrieved successfully.\n');
  } catch (error) {
    console.error('❌ Get Wallpaper Test Failed:', error.message);
    process.exit(1);
  }

  // 8. Wipe Wallpaper Test
  try {
    console.log('8. Testing: Wipe Wallpaper...');
    const res = await fetch(`${BASE_URL}/api/rooms/${roomId}/wipe`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 200, 'Wipe should return 200 OK');

    // Retrieve again, should be empty
    const checkRes = await fetch(`${BASE_URL}/api/rooms/${roomId}/wallpaper`);
    const checkData = await checkRes.json();
    assert.strictEqual(checkData.wallpaper, null, 'Wallpaper should be null after wipe');
    console.log('✅ Wallpaper wiped successfully.\n');
  } catch (error) {
    console.error('❌ Wipe Wallpaper Test Failed:', error.message);
    process.exit(1);
  }

  console.log('🎉 All backend API and database integration tests passed successfully!');
}

runTests();
