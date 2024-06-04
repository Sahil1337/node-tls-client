const colors = {
  reset: "\x1b[0m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
};

export const logger = {
  debug: function (...args: any[]) {
    return process.stdout.write(
      `${colors.cyan}@node-tls-client ~ ${colors.blue}DEBUG:${
        colors.reset
      } ${args.join(" ")}\n`
    );
  },
  error: function (...args: any[]) {
    return process.stdout.write(
      `${colors.cyan}@node-tls-client ~ ${colors.red}ERROR:${
        colors.reset
      } ${args.join(" ")}\n`
    );
  },
  success: function (...args: any[]) {
    return process.stdout.write(
      `${colors.cyan}@node-tls-client ~ ${colors.green}SUCCESS:${
        colors.reset
      } ${args.join(" ")}\n`
    );
  },
  hyperlink: function (text: string, url: string) {
    return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
  },
  stamp: `${colors.cyan}@node-tls-client ~${colors.reset}`,
};
