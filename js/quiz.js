(function() 
{
    var QuizModel = {

        Internals : {
            Questions: {
                NextKey: "next",
                PreviousKey: "prev",
                JSONKeys: {
                    Question: "q",
                    Answers: "a",
                    Detail: "d"
                },
                Questions: [],
                AllAnswers: [],
                Index: -1,
                StartIndex: 0,
                TotalCount: -1,
                AnsweredCount: 0,
                CorrectCount: 0,
                IncorrectCount: 0,
                AnswerSelectionCount: 3,
                GuessesAllowed: 2
            }
        },

        InitWithQuestionsAndSettings: function (questions, settings)
        {
            // Override configurable settings
            QuizModel.Internals.Questions = _.defaults(settings, QuizModel.Internals.Questions);
		    QuizModel.Internals.Questions.Questions = QuizModel.VerifyQuestionData(questions);
		    QuizModel.Internals.Questions.TotalCount = QuizModel.Internals.Questions.Questions.length;

		    QuizModel.Internals.Questions.Index = QuizModel.Internals.Questions.StartIndex;
        },

        GetCurrentQuestion: function()
        {
            return QuizModel.GetQuestionAtIndex();
        },

		GetNextQuestion: function (skipUpdate)
		{
		    var index = QuizModel.Internals.Questions.Index;

		    if (!skipUpdate)
		    {
		        QuizModel.TryUpdateQuestion(index);
		    }

		    index = QuizModel.GetNewIndex(QuizModel.Internals.Questions.NextKey, true);

		    return QuizModel.GetQuestionAtIndex(index);
		},

		GetPreviousQuestion: function (skipUpdate)
		{
		    var index = QuizModel.Internals.Questions.Index;

		    if (!skipUpdate)
		    {
		        QuizModel.TryUpdateQuestion(index);
		    }

		    index = QuizModel.GetNewIndex(QuizModel.Internals.Questions.NextKey, true);

		    return QuizModel.GetQuestionAtIndex(index);
		},

		HasNextQuestion: function()
		{
		    return (QuizModel.GetNewIndex(QuizModel.Internals.Questions.NextKey) < QuizModel.Internals.Questions.TotalCount);
		},

		HasPreviousQuestion: function()
		{
		    return (QuizModel.GetNewIndex(QuizModel.Internals.Questions.PreviousKey) >= 0);
		},

		GetNewIndex: function(direction, updateIndex)
		{
		    var index = QuizModel.Internals.Questions.Index;

		    if (direction === QuizModel.Internals.Questions.PreviousKey)
		    {
		        index = index - 1;

		        if (index < 0)
		        {
		            index = 0;
		        }
		    }
		    else if (direction === QuizModel.Internals.Questions.NextKey)
            {
		        index = index + 1;

		        if (index > QuizModel.Internals.Questions.TotalCount)
		        {
		            index = QuizModel.Internals.Questions.TotalCount;
		        }
            }

		    if (updateIndex)
		    {
		        QuizModel.Internals.Questions.Index = index;
		    }

		    return index;
		},

		GetQuestionAtIndex: function(index)
		{
		    if (!index)
		        index = QuizModel.Internals.Questions.Index;

		    return QuizModel.Internals.Questions.Questions[index];
		},

		GetAnswerSelections: function(index)
		{
		    if (!index)
		        index = QuizModel.Internals.Questions.Index;

		    var selectionCount = QuizModel.Internals.Questions.AnswerSelectionCount;
		    var question = QuizModel.GetQuestionAtIndex(index);

		    if (!question)
		    {
		        QuizModel.ThrowException("Index (" + index + ") passed to GetAnswerSelections is out of range.");
            }

		    var answers = _.uniq(question.GetAnswers());
		    var answersLength = answers.length;

		    if (answersLength < selectionCount)
		    {
		        var otherAnswers = _.without(QuizModel.Internals.Questions.AllAnswers, question.GetCorrectAnswer());
		        var otherAnswersLength = otherAnswers.length;
		        var answer = "";
		        var randomIndex = 0;

		        for (var i = answersLength; i < selectionCount; i++)
		        {
		            randomIndex = Math.floor(otherAnswersLength * Math.random());
		            
		            if (randomIndex < otherAnswersLength - 1)
		            {
		                answer = otherAnswers.slice(randomIndex, randomIndex + 1)[0];
		                otherAnswers = _.without(otherAnswers, answer);
		            }
		            else
		            {
		                answer = otherAnswers.pop();
		            }

                    answers.push(answer);
                    otherAnswersLength = otherAnswers.length;
		        }
            }

		    return _.shuffle(answers);
		},

		UpdateQuestion: function(index)
		{
		    var question = QuizModel.Internals.Questions.Questions[index];

		    if (!question)
		    {
		        QuizModel.ThrowException("Index (" + index + ") passed to UpdateQuestion is out of range.");
            }

		    question.Update();
		},

		TryUpdateQuestion: function(index)
		{
		    try {
		        if (index >= 0)
		        {
		            QuizModel.UpdateQuestion(index);
		        }
            }
		    catch(e){}
		},

		VerifyQuestionData: function(questions)
		{
		    var validQuestions = [];
		    var allAnswers = [];

		    if (!_.isArray(questions))
		    {
		        QuizModel.ThrowException("Question Objects must be submitted in the form of an array.");
		    }

		    // Loop through question data, instantiate and store question instances
            // and store all answers in an array
		    _.each(questions, function (question)
		    {
		        var questionObj = new Question(question);

                // Store all possible answers
		        allAnswers.push(questionObj.GetAnswers());

		        validQuestions.push(questionObj);
            });

            // Flatten and merge answer values, ensuring unique values
		    QuizModel.Internals.Questions.AllAnswers = _.uniq(_.flatten(allAnswers, true));

		    return validQuestions;
		},

		ThrowException: function (message)
		{
		    throw message;
		}
    };


    function Question(question, answers, detail)
    {
        this.Name = "Question";
        this.SRSMax = 5;
        this.SRSValue = 0;
        this.GuessCountMax = QuizModel.Internals.Questions.GuessesAllowed;
        this.GuessCount = 0;
        this.GuessedCorrectly = false;


        this.Question = "";
        this.Answers = [];
        this.CorrectAnswer = "";
        this.Detail = "";


        // Run through the validation 
        if (!question)
        {
            QuizModel.ThrowException("Question values is required to instantiate a new instance of [" + this.Name + "].");
        }
        else if (_.isObject(question))
        {
            var qKey = QuizModel.Internals.Questions.JSONKeys.Question;
            var aKey = QuizModel.Internals.Questions.JSONKeys.Answers;
            var dKey = QuizModel.Internals.Questions.JSONKeys.Detail;

            if (!question.hasOwnProperty(qKey))
            {
                QuizModel.ThrowException("Question parameter is a required attribute of a question.");
            }
            else if (!question.hasOwnProperty(aKey))
            {
                QuizModel.ThrowException("Answer parameter is a required attribute of a question.");
            }

            if (question.hasOwnProperty(dKey))
            {
                detail = question[dKey];
            }

            // Override
            answers = question[aKey];
            question = question[qKey];
        }
        else if (!answers)
        {
            QuizModel.ThrowException("Answer values is required to instantiate a new instance of [" + this.Name + "].");
        }

        if (!_.isArray(answers) || answers.length < 1)
        {
            QuizModel.ThrowException("Answer values must be submitted in the form of an array and may not be empty.");
        }

        this.Question = question
        this.Answers = answers;
        this.CorrectAnswer = answers[0];
        this.Detail = detail;


        /* --- prototype methods --- */

        this.GetAnswerDetail = function ()
        {
            return this.Detail;
        };

        this.GetAnswers = function ()
        {
            return this.Answers;
        };

        this.GetCorrectAnswer = function ()
        {
            return this.CorrectAnswer;
        };

        this.GetGuessCount = function ()
        {
            return this.GuessCount;
        };

        this.GetGuessCountMax = function ()
        {
            return this.GuessCountMax;
        };

        this.IsAnswerCorrect = function (answer)
        {
            if (!this.GuessedCorrectly)
            {
                this.GuessCount++;
            }
            
            this.GuessedCorrectly = (answer == this.CorrectAnswer)

            return this.GuessedCorrectly;
        };

        this.HasExceededGuessLimit = function ()
        {
            return this.GuessCount > this.GuessCountMax;
        };

        this.Update = function ()
        {
            if (this.GuessCount > 0)
            {
                var penalty = this.GuessCount - 1;
                var srsValue = this.SRSValue;

                if (penalty < 1)
                {
                    ++srsValue;
                }
                else
                {
                    srsValue -= penalty;
                }

                this.SRSValue = srsValue;

                this.Reset();
            }
        };

        this.Reset = function(resetAll)
        {
            this.GuessCount = 0;
            this.GuessedCorrectly = false;

            if (resetAll)
            {
                this.SRSValue = 0;
            }
        };
    };


    function QuizController(questionElementId, answerElementIds)
    {
        this.QuizModel = QuizModel;
        this.QuestionElement = null;
        this.AnswerElements = [];
        this.Initialized = false;

        if (!questionElementId)
        {
            QuizModel.ThrowException("Question Element Id is required to instantiate a new instance of [" + this.Name + "].");
        }
        else if (!answerElementIds || !_.isArray(answerElementIds))
        {
            QuizModel.ThrowException("Answer Element Ids are required and must be submitted in the form of an array.");
        }




        var questions = [
            {
                q: "Why x?",
                a: ["x"],
                d: "X is so because it is."
            },
            {
                q: "Why y?",
                a: ["y"],
                d: "Y not?"
            },
            {
                q: "Why z?",
                a: ["z"],
                d: "Z is blah."
            },
            {
                q: "Why a?",
                a: ["a", "b"],
                d: "A is to B as B is to C."
            }
        ];

        var settings = {
            AnswerSelectionCount: answerElementIds.length
        };

        // Initialize Model
        this.QuizModel.InitWithQuestionsAndSettings(questions, settings);

        // Verify that question element exists
        this.QuestionElement = document.getElementById(questionElementId);

        if (!this.QuestionElement)
        {
            QuizModel.ThrowException("Question Element [" + questionElementId + "] could not be located within the DOM.");
        }


        // Verify that answer elements exist
        var answerElementCount = answerElementIds.length;
        var answerElement = null;

        for (var ai = 0; ai < answerElementCount; ai++)
        {
            answerElement = document.getElementById(answerElementIds[ai]);

            if (!answerElement)
            {
                QuizModel.ThrowException("Answer Element [" + answerElementIds[ai] + "] could not be located within the DOM.");
            }

            this.AnswerElements.push(answerElement);
        }


        /* --- prototype methods --- */

        this.NextQuestion = function ()
        {
            if (this.QuizModel.HasNextQuestion())
            {
                this.QuizModel.GetNextQuestion();
                this.PrepareElementValues();
            }
        };

        this.PreviousQuestion = function ()
        {
            if (this.QuizModel.HasPreviousQuestion())
            {
                this.QuizModel.GetPreviousQuestion();
                this.PrepareElementValues();
            }
        };

        this.PrepareElementValues = function ()
        {
            var question = this.QuizModel.GetCurrentQuestion();
            var answers = this.QuizModel.GetAnswerSelections();
            var answerElementsLength = this.AnswerElements.length;
            var answersLength = answers.length;
            var answerElement = null;

            this.QuestionElement.innerText = question.Question;

            for (var i = 0; i < answerElementsLength; i++)
            {
                answerElement = this.AnswerElements[i];
                answerElement.value = answers[i];
                answerElement.disabled = null;

                if (!this.Initialized)
                {
                    answerElement.controller = this;
                    answerElement.addEventListener("click", function ()
                    {
                        this.disabled = true;
                        this.controller.CompareAnswers.call(this.controller, this.value);
                    });
                }
            }

            this.Initialized = true;
        };

        this.CompareAnswers = function (answer)
        {
            var question = this.QuizModel.GetCurrentQuestion();

            if (question.IsAnswerCorrect(answer))
            {
                this.DisableInputElements(true);

                if (!question.HasExceededGuessLimit())
                {
                    alert("correct!");
                }

                this.NextQuestion();
            }
            else
            {
                if (!question.HasExceededGuessLimit())
                {
                    alert("try again");
                }
                else
                {
                    this.DisableInputElements(true);
                    this.QuestionElement.innerText = question.GetAnswerDetail();
                }
            }
        };

        this.DisableInputElements = function (ignoreCorrect)
        {
            var question = this.QuizModel.GetCurrentQuestion();
            var correctAnswer = question.GetCorrectAnswer();
            var answerElements = this.AnswerElements;
            var answerElementsLength = answerElements.length;

            for (var i = 0; i < answerElementsLength; i++)
            {
                answerElement = answerElements[i];
                answerElement.disabled = true;

                if (ignoreCorrect && answerElement.value == correctAnswer)
                {
                    answerElement.disabled = null;
                }
            }
        };

        this.PrepareElementValues();

    };

    // Assign QuizController to global scope
    this.QuizController = QuizController;
	
}).call(this);