describe('App launch (smoke)', () => {
  it('launches without crashing and takes a screenshot', async () => {
    await device.launchApp({ newInstance: true });
    // Give the app time to settle; adjust if needed.
    await new Promise((r) => setTimeout(r, 4000));
    await device.takeScreenshot('home');
  });
});