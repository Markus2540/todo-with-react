import React from 'react';

class NewTaskForm extends React.Component {
    render() {
        return (
            <div className='todoaddnew'>
                <details>
                    <summary className='noselection'>Uusi tehtävä</summary>
                    <form onSubmit={(e) => {
                            this.props.addTaskToDo(e);
                            this.props.getTasks();
                    }}>
                        <label>Tehtävä: <br />
                        <input type="text" onChange={this.props.handleTitleChange} 
                        value={this.props.title} /></label>
                        <br />
                        <label>Kuvaus: <br />
                        <textarea onChange={this.props.handleDescriptionChange} 
                        value={this.props.description} /></label>
                        <br /><br />
                        <input type="submit" value="Tallenna" />
                    </form>
                </details>
            </div>
        );
    }
}

class ExistingTask extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            progression: props.progression,
            originalProgression: props.progression,
            status: props.status,
            originalStatus: props.status
        }

        this.handleProgressionChange = this.handleProgressionChange.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.returnOriginals = this.returnOriginals.bind(this);
        this.updateTask = this.updateTask.bind(this);
        this.deleteTask = this.deleteTask.bind(this);
        this.confirmDeletion = this.confirmDeletion.bind(this);
    }

    handleProgressionChange(event) {
        this.setState({progression: event.target.value});
    }

    handleStatusChange(value) {
        this.setState({status: value});
    }

    returnOriginals(event) {
        this.setState({progression: this.state.originalProgression});
        this.setState({status: this.state.originalStatus});
    }

    updateTask(e) {
        e.preventDefault();

        const objectStore = this.props.db.transaction(["toDoList"], "readwrite")
        .objectStore("toDoList");

        const objectStoreIDRequest = objectStore.get(this.props.id);

        objectStoreIDRequest.onsuccess = () => {
            const data = objectStoreIDRequest.result;

            data.progression = this.state.progression;
            data.status = this.state.status;

            const updateIDRequest = objectStore.put(data);

            this.setState({
                originalProgression: this.state.progression,
                originalStatus: this.state.status
            });

            // Update the list of tasks to be shown
            this.props.getTasks();
        };
    }

    confirmDeletion() {
        if (window.confirm(`Haluatko poistaa tehtävän ${this.props.title}?`)) {
            this.deleteTask();
        }
    }

    deleteTask() {
        const transaction = this.props.db.transaction(["toDoList"], "readwrite");
        const objectStore = transaction.objectStore("toDoList");
        const deleteRequest = objectStore.delete(this.props.id);

        transaction.onerror = () => {
            console.log("Tehtävän poistossa ongelmia");
        };
        transaction.oncomplete = () => {
            console.log("Tehtävä poistettu.");
            this.props.getTasks();
        };
    }

    render() {
        return (
            <div key={this.props.id} className="singletaskcontainer">
                <h2 className='taskheader'>{this.props.title}</h2>
                <p className='taskdescription'>{this.props.description}</p>
                <form onSubmit={(e) => this.updateTask()}>
                    <fieldset>
                        <legend>Tila</legend>
                        <input type="radio" name="status" id={`eialoitettu${this.props.id}`}
                        value="Ei aloitettu" checked={this.state.status === "Not started"}
                        onChange={e => this.handleStatusChange("Not started")} />

                        <label htmlFor={`eialoitettu${this.props.id}`}>Ei aloitettu</label>
                        <input type="radio" name="status" id={`kesken${this.props.id}`}
                        value="Kesken" checked={this.state.status === "Partially done"}
                        onChange={e => this.handleStatusChange("Partially done")} />

                        <label htmlFor={`kesken${this.props.id}`}>Kesken</label>
                        <input type="radio" name="status" id={`valmis${this.props.id}`}
                        value="Valmis" checked={this.state.status === "Done"}
                        onChange={e => this.handleStatusChange("Done")} />

                        <label htmlFor={`valmis${this.props.id}`}>Valmis</label>
                    </fieldset>
                    <label>Kuvaus</label><br />
                    <textarea value={this.state.progression} 
                    onChange={this.handleProgressionChange} /><br />

                    <div className='evenbuttondistribution'>
                        <input className='bg-red' type="button" value="Poista" 
                        onClick={this.confirmDeletion} />

                        <input type="button" value="Reset" onClick={this.returnOriginals} />
                        <input className='bg-green' type="submit" value="Tallenna" 
                        onClick={this.updateTask} />
                    </div>
                </form>
            </div>
        );
    }
}

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            db: "",
            tasks: [],
            title: "", // New task
            description: "" // New task
        };
        
        this.getTasks = this.getTasks.bind(this);
        this.addTaskToDo = this.addTaskToDo.bind(this);
        this.handleTitleChange = this.handleTitleChange.bind(this);
        this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    }

    componentDidMount() {
        // Request opening a connection to a database
        const openRequest = window.indexedDB.open("toDoList", 1);

        // Log error message to console
        openRequest.onerror = (e) => {
            console.log("Failed to open database");
        };

        // Log success message to console and update db state variable
        openRequest.onsuccess = (e) => {
            console.log("Database opened succesfully");
            // Store the result of opening the database in the db state
            this.setState((state, props) => ({
                db: openRequest.result
            }));
        };

        // This event creates a new database if one has not been created or a 
        // higher version number exists.
        openRequest.onupgradeneeded = (e) => {
            const db = e.target.result;

            db.onerror = (e) => {
                console.log("onupgradeneeded failed/loading of database failed");
            };

            const objectStore = db.createObjectStore("toDoList", {
                keyPath: "taskID",
                autoIncrement: true,
            });

            objectStore.createIndex("title", "title", {unique: false});
            objectStore.createIndex("description", "description", {unique: false});
            objectStore.createIndex("progression", "progression", {unique: false});
            objectStore.createIndex("status", "status", {unique: false});

            console.log("Database created");
        };



        //this.getTasks();
        /*
        If you run getTasks() immediately you will get a db is undefined error. 
        You can set a timeout that calls getTasks function after set time and 
        load tasks to state tasks variable.
         */
        setTimeout(() => {this.getTasks();}, 250);
    }

    getTasks() {
        // Retrieve all objects and store them in an array called tasks.
        const tasks = [];
        const objectStore = this.state.db.transaction("toDoList").objectStore("toDoList");

        objectStore.openCursor().addEventListener("success", (e) => {
            const task = e.target.result;
            if(task) {
                tasks.push(task.value);
                task.continue();
            } else {
                console.log("All tasks added to array.");
                // Copy tasks array to state variable.
                this.setState((state, props) => ({
                    tasks: tasks
                }));
            }
        });
    }

    addTaskToDo(e) {
        e.preventDefault();
        let newTask = {
            title: this.state.title, 
            description: this.state.description, 
            progression: "", 
            status: "Not started" 
        };

        let transaction = this.state.db.transaction(['toDoList'], 'readwrite');
        
        transaction.onerror = function() {
            console.log('Transaction error');
        };

        transaction.oncomplete = function() {
            //this.getTasks();
        };


        let objectStore = transaction.objectStore('toDoList');
        let request = objectStore.add(newTask);

        request.onsuccess = (event) => {
            console.log('Request.onsuccess');
            this.setState({title: ""});
            this.setState({description: ""});
        };
    }

    handleTitleChange(event) {
        this.setState({title: event.target.value});
    }

    handleDescriptionChange(event) {
        this.setState({description: event.target.value});
    }

    render() {
        let existingTasks;
        if (this.state.tasks.length > 0) {
            existingTasks = this.state.tasks.map((task) => 
            <ExistingTask key={task.taskID} id={task.taskID} title={task.title}
            description={task.description} progression={task.progression} 
            status={task.status} getTasks={this.getTasks} db={this.state.db} />
            );
        } else {
            existingTasks = <p>Ei näytettäviä tehtäviä</p>;
        }
        
        return(
            <div className='todoarea'>
                <div className='todoheader'>
                    <h2>Tehtävälista</h2>
                </div>
                <NewTaskForm 
                    title={this.state.title}
                    description={this.state.description}
                    getTasks={this.getTasks}
                    addTaskToDo={this.addTaskToDo}
                    handleTitleChange={this.handleTitleChange}
                    handleDescriptionChange={this.handleDescriptionChange}
                />
                <div className='taskstodo'>
                    {existingTasks}
                </div>
            </div>
        );
    }
}

export default App;