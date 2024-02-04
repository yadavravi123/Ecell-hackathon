const mongoose = require('mongoose');

require('dotenv').config();



const conn = process.env.DB_STRING;

const connection = mongoose.createConnection(conn, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const ObjectId = mongoose.Schema.ObjectId;
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    hash: String,
    salt: String,
    admin: Boolean,
});

// assuming each subject is teachen by single faculty
const AssignmentSchema = new mongoose.Schema({
    ass_id:String,
    title: {
        type: String,
        required: true
    },
    due_date: {
        type: Date,
        required: true
    },
    total_score:{
        type: Number,
        default: null
    },
    subject_name: {
        type: String,
        required: true,
    }
});

const SubmittedSchema=new mongoose.Schema({
    student_name:String,
    subject_name:String,
    ass_id:String,
})

const NSubmittedSchema=new mongoose.Schema({
    student_name:String,
    subject_name:String,
    ass_id:String,
})

const StudentSchema = new mongoose.Schema([
    {
        student_name: { type: String },
        student_id: { type: String },
        Subjects: [
            {
                name: String,
                id: String,
            }
        ]
    }
])

const SubjectSchema = new mongoose.Schema({
    subject_name:String,
    teacher_name:String,
}
)

const TeacherSchema = new mongoose.Schema([{
    teacher_name: { type: String, required: true },
    teacher_id: { type: String, required: true },
    subject_name: { type: String },
    subject_id: { type: String },
    students: [{
        name: String,
        id: String,
    }
    ]
}])

const Subjects = connection.model("Subjects", SubjectSchema);
const Teachers = connection.model("Teachers", TeacherSchema);
const User = connection.model('User', UserSchema);
const Students = connection.model('Students', StudentSchema);
const Assignments = connection.model('Assignments', AssignmentSchema);
const Submitted= connection.model("Submitted",SubmittedSchema);
const NSubmitted= connection.model("NSubmitted",NSubmittedSchema);
// Expose the connection
module.exports = connection