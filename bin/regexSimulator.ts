import net from "net";

function findAvailablePort(port: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(port));
    });

    server.on("error", () => resolve(findAvailablePort(port + 1)));
  });
}

export async function runRegexSimulator() {
  await findAvailablePort(4000);
}
