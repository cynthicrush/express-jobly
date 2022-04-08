const { sqlForPartialUpdate } = require('./sql')

describe('sqlForPartialUpdate', function() {
    test('works: 2 dataToUpdate', function() {
        const results = sqlForPartialUpdate(
            {lastName: 'Canada',  firstName: 'Cynthia'},
            {firstName: 'first_name'}
        )
        expect(results).toEqual({
            setCols: "\"lastName\"=$1, \"first_name\"=$2",
            values: ["Canada", "Cynthia"],
        })
    })
})