async function run() {
  try {
    const res = await fetch('https://monika-opticals2-henna.vercel.app/api-config.js');
    console.log(res.status);
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
run();
