/** One service, used to show that a CLI argument takes precedence over what this file says. */
export default {
  emitMode: "ts",
  services: {
    only: { serviceName: "FromConfig", source: "../dummy.xml", output: "build/from-config" },
  },
};
