# 👁 Panopticon 👁

Read-only web ui for keeping tabs on the GoGoPool Protocol.

Built with modern tech but using old skool techniques. No React/Vue/Svetle/etc. Just locally-sourced, organic HTML and Javascript (ECMA2020).

- Built-in Go web server, so the entire app + html compiles down into a single binary.
- Liberal use of `<script type="module">` and https://skypack.dev
- Multicall is used to gather data from multiple contracts/functions in one call
- [Tabulator](http://tabulator.info) provides the data tables
- Instead of AvalancheJS's horrendously complicated CB58 code, check out `utils.js#cb58Encode`
- Deployment definitions can declaratively specify what data to grab from which contract, and how it should be formatted/transformed, making it easily extendable.

- `transformer.js` implements an async pipeline to apply the desired transforms to an array of objects.

![](docs/Panopticon.jpg)
