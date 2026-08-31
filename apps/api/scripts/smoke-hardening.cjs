const fs = require('fs');
const path = require('path');
const os = require('os');

const BASE = 'http://localhost:4000/api/v1';
const PASS = process.env.SEED_SUPER_ADMIN_PASSWORD;
if (!PASS) {
  console.error('Set SEED_SUPER_ADMIN_PASSWORD before running smoke tests.');
  process.exit(1);
}
const failures = [];

async function req(method, urlPath, { token, body, formPath } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let bodyInit;
  if (formPath) {
    const form = new FormData();
    const buf = fs.readFileSync(formPath);
    form.append('file', new Blob([buf], { type: 'application/pdf' }), 'smoke.pdf');
    bodyInit = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    bodyInit = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${urlPath}`, { method, headers, body: bodyInit });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

function expect(label, actual, expected) {
  if (actual === expected) {
    console.log(`PASS ${label} (${actual})`);
  } else {
    console.log(`FAIL ${label} got=${actual} expected=${expected}`);
    failures.push(label);
  }
}

async function login(email) {
  const { status, json } = await req('POST', '/auth/login', {
    body: { email, password: PASS },
  });
  if (status !== 201 && status !== 200) {
    throw new Error(`login failed for ${email}: ${status} ${JSON.stringify(json)}`);
  }
  return json.data;
}

async function main() {
  const ready = await req('GET', '/health/ready');
  expect(
    'health ready',
    ready.json?.data?.checks?.postgres === 'ok' &&
      ready.json?.data?.checks?.redis === 'ok'
      ? 1
      : 0,
    1,
  );

  const admin = await login('admin@mahbereahaw.org');
  const instructor = await login('instructor@mahbereahaw.org');
  const student = await login('student@mahbereahaw.org');
  console.log('PASS logins');

  const course = await req('POST', '/courses', {
    token: admin.accessToken,
    body: {
      title: `Locked Smoke ${Date.now()}`,
      description: 'locked',
      monthNumber: 6,
    },
  });
  const courseId = course.json.data.id;
  await req('POST', `/courses/${courseId}/publish`, { token: admin.accessToken });
  const asg = await req('POST', `/assignments/courses/${courseId}`, {
    token: admin.accessToken,
    body: {
      title: 'Locked Assignment',
      description: 'x',
      dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      maxScore: 100,
    },
  });
  const assignmentId = asg.json.data.id;

  const pdf = path.join(os.tmpdir(), 'smoke-locked.pdf');
  fs.writeFileSync(pdf, Buffer.from('%PDF-1.4 smoke'));
  const drip = await req('POST', `/submissions/assignments/${assignmentId}`, {
    token: student.accessToken,
    formPath: pdf,
  });
  expect('drip locked submit', drip.status, 403);

  const instr2 = await req('POST', '/users/instructors', {
    token: admin.accessToken,
    body: {
      email: `smoke-${Date.now()}@mahbereahaw.org`,
      firstName: 'Smoke',
      lastName: 'Instructor',
      title: 'Tester',
    },
  });
  const instr2Login = await req('POST', '/auth/login', {
    body: {
      email: instr2.json.data.user.email,
      password: instr2.json.data.temporaryPassword,
    },
  });
  const instr2Token = instr2Login.json.data.accessToken;

  const courses = await req('GET', '/courses', { token: student.accessToken });
  const list = Array.isArray(courses.json.data)
    ? courses.json.data
    : courses.json.data.items;
  const month1 = list.find((c) => c.monthNumber === 1);

  const freshAsg = await req('POST', `/assignments/courses/${month1.id}`, {
    token: admin.accessToken,
    body: {
      title: `Smoke Grade ${Date.now()}`,
      description: 'fresh for grading',
      dueAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      maxScore: 100,
    },
  });
  const openAsg = freshAsg.json.data;

  await req('POST', `/submissions/assignments/${openAsg.id}`, {
    token: student.accessToken,
    formPath: pdf,
  });
  const subs = await req('GET', `/submissions/assignments/${openAsg.id}`, {
    token: instructor.accessToken,
  });
  const subId = subs.json.data[0].id;

  const deny = await req('POST', `/grading/submissions/${subId}`, {
    token: instr2Token,
    body: { score: 50, feedback: 'no' },
  });
  expect('unassigned instructor grade', deny.status, 403);

  const allow = await req('POST', `/grading/submissions/${subId}`, {
    token: instructor.accessToken,
    body: { score: 91, feedback: 'yes' },
  });
  if ([200, 201].includes(allow.status)) {
    console.log(`PASS assigned instructor grade (${allow.status})`);
  } else {
    console.log(`FAIL assigned instructor grade got=${allow.status}`);
    console.log(JSON.stringify(allow.json));
    failures.push('assigned instructor grade');
  }

  const rotated = await req('POST', '/auth/refresh', {
    body: { refreshToken: student.refreshToken },
  });
  const newRefresh = rotated.json.data.refreshToken;
  const reuse = await req('POST', '/auth/refresh', {
    body: { refreshToken: student.refreshToken },
  });
  expect('refresh reuse rejected', reuse.status, 401);
  const family = await req('POST', '/auth/refresh', {
    body: { refreshToken: newRefresh },
  });
  expect('refresh family revoked', family.status, 401);

  if (failures.length) {
    console.error('FAILURES:', failures.join(', '));
    process.exit(1);
  }
  console.log('=== ALL SMOKE CHECKS PASSED ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
