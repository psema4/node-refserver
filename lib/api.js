function getAll(req, res) {
    res.status(200).send('All the things');
}

module.exports = {
    getAll: getAll
}
