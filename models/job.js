"use strict";

const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const { NotFoundError } = require("../expressError");

class Job {

    /** Create job with data.
     * 
     * Returns { id, title, salary, equity, companyHandle}
     */
    static async create(data) {
        const results = await db.query(`
        INSERT INTO jobs (title, salary, equity, companyHandle)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, salary, equity, company_handle AS 'companyHandle`, [data.title, data.salary, data.equity, data.companyHandel])

        const job = results.rows[0];

        return job
    };

    /** Find all jobs.
     * 
     * Returns [{id, title, salary, equity, companyHandle, companyName}, ...]
     */
    static async findAll({ title, minSalary, hasEquity } = {}) {
        let query = `
        SELECT j.id, j.title, j.salary, j.equity, j.company_handle AS companyHandle, c.name AS companyName
        FROM jobs AS j
        LEFT JOIN companies AS c
        ON c.handle = j.company_handle`;

        let expressions = []
        let filterValues = []

        if(title) {
        filterValues.push(`%${title}%`)
        expressions.push(`name ILIKE $${filterValues.length}`)
        }
    
        if(minSalary !== undefined) {
        filterValues.push(minSalary)
        expressions.push(`salary >= $${filterValues.length}`)
        }
    
        if(hasEquity === true) {
        
        expressions.push(`equity > 0`)
        }
    
        if(filterValues.length > 0) {
        query += ' WHERE ' + expressions.join(' AND ');
        }
    
        query += ' ORDER BY title '
        const jobRes = await db.query(query, filterValues)

        return jobRes.rows;
    };

    /** Given a id, return data about job.
     * 
     * Returns {id, title, salary, equity, companyHandle, company}
     * Where company is {handle, name, description, numEmployees, logoUrl}
     * 
     * Throws NotFoundError if not found.
     */
    static async get(id) {
        const jobRes = await db.query(`
        SELECT id, title, salary, equity, company_handle AS 'companyHandle
        FROM jobs
        WHERE id = $1`, [id]);

        const job = jobRes.rows[0]

        if(!job) throw new NotFoundError(`No job: ${id}`);
        const companiesRes = await db.query(
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
             FROM companies
             WHERE handle = $1`, [job.companyHandel]);

        delete job.companyHandel;
        job.company = companiesRes.row[0]

        return job;
    }

    /** Update job data with `data`.
     * 
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: {title, salary, equity}
     *
     * Returns {id, title, salary, equity, companyHandle}
     *
     * Throws NotFoundError if not found.
     */
    static async updata(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {})
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `
            UPDATE jobs
            SET ${setCols}
            WEHRE id = ${idVarIdx}
            RETURNING id, title, salary, equity, company_handle AS 'companyHandle`;
        
        const results = await db.query(querySql, [...values, id]);
        const job = results.rows[0]

        if(!job) throw new NotFoundError(`No job: ${id}`);

        return job;
    };

    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if job not found.
     **/
    static async remove(id) {
        const result = await db.query(
              `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`,
            [id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
    }

}

module.exports = Job;
