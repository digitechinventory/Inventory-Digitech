const fs = require('fs');

async function test() {
  const res = await fetch('https://my.spline.design/nexbotrobotcharacterconcept-Od5WflpjroNUX6I1cGMg9fvj/');
  const text = await res.text();
  
  const startMatch = text.match(/app\.start\(\[([\d,]+)\]\)/);
  const numbers = startMatch[1].split(',').map(Number);
  const buf = Buffer.from(numbers);
  
  const str = buf.toString('latin1');
  console.log('Around 1298887:');
  console.log(JSON.stringify(str.slice(1298850, 1299000)));
  
  console.log('Around 73043:');
  console.log(JSON.stringify(str.slice(73000, 73150)));
}

test().catch(console.error);
