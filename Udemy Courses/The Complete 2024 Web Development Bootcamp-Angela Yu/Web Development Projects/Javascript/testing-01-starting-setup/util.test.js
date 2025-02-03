const { generateText } = require("./util");

test("shpuld out ", () => {
    const text = generateText("Max", 29);
    expect(text).toBe("Max (29 years old)");
});

