async function main() {
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (!password) {
    console.error('Set SEED_SUPER_ADMIN_PASSWORD before running smoke tests.');
    process.exit(1);
  }

  const base = 'http://localhost:4000/api/v1';
  const login = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@mahbereahaw.org',
      password,
    }),
  });
  const loginJson = await login.json();
  const token = loginJson.data?.accessToken;
  if (!token) throw new Error('login failed');

  const metrics = await fetch(`${base}/dashboard/admin/metrics?days=14`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await metrics.json();
  if (![200, 201].includes(metrics.status) || !body.data?.summary) {
    console.error(body);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        status: metrics.status,
        students: body.data.summary.students,
        gradedThisWeek: body.data.summary.gradedThisWeek,
        seriesDays: body.data.series.submissions.length,
        months: body.data.coursesByMonth.length,
        pipeline: body.data.submissionPipeline,
      },
      null,
      2,
    ),
  );
  console.log('METRICS SMOKE PASSED');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
