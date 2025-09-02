const http = require("http");

describe("Express server port test", () => {
  test("should be listening on port 8000", (done) => {
    const options = {
      hostname: "localhost",
      port: 8000,
      path: "/",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      expect([200, 404]).toContain(res.statusCode);
      done();
    });

    req.on("error", (err) => {
      done(err);
    });

    req.end();
  });
});
