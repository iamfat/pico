describe('pico', () => {
    it('load js', async () => {
        const add = await pico.load('/__spec__/res/add.js');
        expect(add(1, 2)).toBe(3);
    });

    it('load deps', async () => {
        pico.define('hello', ['/__spec__/res/add.js', '/__spec__/res/sub.js'], (add, sub) => {
            return [add(1, 2), sub(5, 4)];
        });
        const [three, one] = await pico.load('hello');
        expect(three).toBe(3);
        expect(one).toBe(1);
    });
});
