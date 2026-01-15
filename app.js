import React, { useState } from 'react';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CATEGORIES = {
  'Student Outcome-Oriented': [
    { name: 'Workforce-aligned', note: 'Does the course prepare students for real job roles? Look for industry partnerships, relevant skills, job placement data, and alignment with labor market needs.' },
    { name: 'Credible', note: 'Is the course recognized and respected? Consider accreditation, institutional reputation, instructor credentials, and how employers view the credential.' },
    { name: 'Cost-efficient', note: 'Does it provide good value? Compare tuition, time to completion, ROI, and total cost of ownership including materials and fees.' },
    { name: 'Personalized', note: 'Can students learn at their own pace and style? Look for adaptive learning, flexible scheduling, customized pathways, and individual support.' }
  ],
  'Curriculum-Rich': [
    { name: 'Competency-aligned assessments', note: 'Do assessments measure real skills? Look for performance-based evaluation, authentic tasks, clear rubrics, and alignment with learning objectives.' },
    { name: 'Integrated learning science', note: 'Does instruction follow evidence-based practices? Consider spaced repetition, retrieval practice, cognitive load management, and research-backed pedagogy.' },
    { name: 'Social connection supported', note: 'Are there opportunities for peer interaction? Look for discussion forums, group projects, peer review, cohort models, and community building.' },
    { name: 'Instructional and assessment technologies use effectively', note: 'Are the right tools used well? Consider whether technology enhances learning, is intuitive, provides useful feedback, and supports course goals.' }
  ],
  'Experientially Appealing': [
    { name: 'Accessibility prioritized', note: 'Can all learners access the content? Check for WCAG compliance, screen reader support, captions, keyboard navigation, and inclusive design.' },
    { name: 'Easy to use', note: 'Is the interface intuitive? Consider navigation clarity, consistent design, minimal friction, helpful onboarding, and user-friendly interactions.' },
    { name: 'Satisfying learning experiences with strong presentational technology', note: 'Is it engaging and polished? Look for high-quality media, interactive elements, visual design, smooth performance, and motivating experiences.' }
  ],
  'Scalable': [
    { name: 'Repeatable design patterns', note: 'Can the course model be replicated? Look for templated structures, standardized components, documented processes, and consistent frameworks.' },
    { name: 'Operational efficiency to support growth', note: 'Can it handle more students without proportional cost increases? Consider automation, instructor-to-student ratios, support systems, and infrastructure.' }
  ]
};

const SCHOOLS = ['WSB', 'WST', 'WSE', 'LSH'];
const COMPETITOR_TYPES = ['Other online universities', 'Publishing companies', 'Workforce learning offerings', 'Learning experiences outside higher ed'];

const RATING_OPTIONS = [
  { value: -2, label: 'Much Lower' },
  { value: -1, label: 'Lower' },
  { value: 0, label: 'Equal' },
  { value: 1, label: 'Higher' },
  { value: 2, label: 'Much Higher' }
];

export default function CourseComparisonTool() {
  const [comparisons, setComparisons] = useState([]);
  const [expandedComparisons, setExpandedComparisons] = useState({});
  const [expandedCriteria, setExpandedCriteria] = useState({});
  const [criteriaWeights, setCriteriaWeights] = useState(
    Object.values(CATEGORIES).flat().reduce((acc, criterion) => ({ ...acc, [criterion.name]: 1 }), {})
  );
  const [categoryWeights, setCategoryWeights] = useState(
    Object.keys(CATEGORIES).reduce((acc, category) => ({ ...acc, [category]: 1 }), {})
  );
  const [currentComparison, setCurrentComparison] = useState({
    school: '',
    courseName: '',
    competitorType: '',
    competitorName: '',
    competitorCourseName: '',
    alignment: 3,
    ratings: Object.values(CATEGORIES).flat().reduce((acc, criterion) => ({ ...acc, [criterion.name]: 0 }), {})
  });
  const [activeView, setActiveView] = useState('input');
  const [multiCompareView, setMultiCompareView] = useState('individual');

  const addComparison = () => {
    if (currentComparison.school && currentComparison.courseName && currentComparison.competitorType && currentComparison.competitorName && currentComparison.competitorCourseName) {
      setComparisons([...comparisons, { ...currentComparison, id: Date.now() }]);
      setCurrentComparison({
        school: '',
        courseName: '',
        competitorType: '',
        competitorName: '',
        competitorCourseName: '',
        alignment: 3,
        ratings: Object.values(CATEGORIES).flat().reduce((acc, criterion) => ({ ...acc, [criterion.name]: 0 }), {})
      });
    }
  };

  const deleteComparison = (id) => {
    setComparisons(comparisons.filter(c => c.id !== id));
  };

  const calculateWeightedScore = (comparison) => {
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(CATEGORIES).forEach(([category, criteria]) => {
      const categoryWeight = categoryWeights[category];
      criteria.forEach(criterion => {
        const criterionWeight = criteriaWeights[criterion.name];
        const rating = comparison.ratings[criterion.name];
        totalScore += rating * criterionWeight * categoryWeight;
        totalWeight += criterionWeight * categoryWeight;
      });
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };

  const getRadarData = (comparison) => {
    return Object.entries(CATEGORIES).map(([category, criteria]) => {
      const avgRating = criteria.reduce((sum, criterion) => sum + comparison.ratings[criterion.name], 0) / criteria.length;
      return {
        category: category.replace(' ', '\n'),
        score: avgRating + 2
      };
    });
  };

  const getAggregateBySchool = () => {
    const schoolData = {};
    comparisons.forEach(comp => {
      if (!schoolData[comp.school]) {
        schoolData[comp.school] = { total: 0, count: 0 };
      }
      schoolData[comp.school].total += calculateWeightedScore(comp);
      schoolData[comp.school].count += 1;
    });
    
    return Object.entries(schoolData).map(([school, data]) => ({
      school,
      avgScore: data.count > 0 ? data.total / data.count : 0
    }));
  };

  const getAggregateByCompetitor = () => {
    const competitorData = {};
    comparisons.forEach(comp => {
      if (!competitorData[comp.competitorType]) {
        competitorData[comp.competitorType] = { total: 0, count: 0 };
      }
      competitorData[comp.competitorType].total += calculateWeightedScore(comp);
      competitorData[comp.competitorType].count += 1;
    });
    
    return Object.entries(competitorData).map(([type, data]) => ({
      type,
      avgScore: data.count > 0 ? data.total / data.count : 0
    }));
  };

  const getMultiCourseComparison = () => {
    const grouped = {};
    comparisons.forEach(comp => {
      const key = `${comp.school}-${comp.courseName}`;
      if (!grouped[key]) {
        grouped[key] = {
          school: comp.school,
          courseName: comp.courseName,
          competitors: []
        };
      }
      grouped[key].competitors.push(comp);
    });
    return Object.values(grouped).filter(g => g.competitors.length > 1);
  };

  const getVerdictBadge = (score) => {
    if (score > 0.5) {
      return <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded font-semibold text-sm">✓ Your course is market-leading</span>;
    } else if (score < -0.5) {
      return <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded font-semibold text-sm">⚠ Competitor course is market-leading</span>;
    } else {
      return <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded font-semibold text-sm">≈ Courses are competitive</span>;
    }
  };

  const getAlignmentLabel = (alignment) => {
    const labels = {
      1: "Not aligned",
      2: "Somewhat",
      3: "Moderate",
      4: "Close",
      5: "Apples-to-apples"
    };
    return labels[alignment];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg p-3 shadow-lg">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="8" width="36" height="4" fill="white" opacity="0.9"/>
              <rect x="2" y="18" width="30" height="4" fill="white" opacity="0.7"/>
              <rect x="2" y="28" width="24" height="4" fill="white" opacity="0.5"/>
              <circle cx="35" cy="10" r="2" fill="white"/>
              <circle cx="29" cy="20" r="2" fill="white"/>
              <circle cx="23" cy="30" r="2" fill="white"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Yardstick</h1>
        </div>
        
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setActiveView('input')}
            className={`px-4 py-2 rounded ${activeView === 'input' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Add Comparisons
          </button>
          <button
            onClick={() => setActiveView('weights')}
            className={`px-4 py-2 rounded ${activeView === 'weights' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Set Weights
          </button>
          <button
            onClick={() => setActiveView('results')}
            className={`px-4 py-2 rounded ${activeView === 'results' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            View Results
          </button>
        </div>

        {activeView === 'input' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add Course Comparison</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">School</label>
                <select
                  value={currentComparison.school}
                  onChange={(e) => setCurrentComparison({ ...currentComparison, school: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select school</option>
                  {SCHOOLS.map(school => <option key={school} value={school}>{school}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Course Name</label>
                <input
                  type="text"
                  value={currentComparison.courseName}
                  onChange={(e) => setCurrentComparison({ ...currentComparison, courseName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Competitor Type</label>
                <select
                  value={currentComparison.competitorType}
                  onChange={(e) => setCurrentComparison({ ...currentComparison, competitorType: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select competitor type</option>
                  {COMPETITOR_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Competitor Name</label>
                <input
                  type="text"
                  value={currentComparison.competitorName}
                  onChange={(e) => setCurrentComparison({ ...currentComparison, competitorName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter competitor name"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Competitor Course Name</label>
                <input
                  type="text"
                  value={currentComparison.competitorCourseName}
                  onChange={(e) => setCurrentComparison({ ...currentComparison, competitorCourseName: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Enter competitor course name"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Course Alignment (How comparable are these courses?)</label>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500 w-24">Not aligned</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={currentComparison.alignment}
                    onChange={(e) => setCurrentComparison({ ...currentComparison, alignment: parseInt(e.target.value) })}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-24 text-right">Highly aligned</span>
                  <div className="w-24 text-center">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      {getAlignmentLabel(currentComparison.alignment)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(CATEGORIES).map(([category, criteria]) => (
                <div key={category} className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-3">{category}</h3>
                  <div className="grid gap-3">
                    {criteria.map(criterion => (
                      <div key={criterion.name} className="border-l-2 border-gray-200 pl-3">
                        <div className="flex items-start gap-3 mb-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <button
                                onClick={() => setExpandedCriteria(prev => ({ ...prev, [criterion.name]: !prev[criterion.name] }))}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                {expandedCriteria[criterion.name] ? '▼' : '▶'}
                              </button>
                              <label className="text-sm font-medium">{criterion.name}</label>
                            </div>
                            {expandedCriteria[criterion.name] && (
                              <p className="text-xs text-gray-600 italic mt-2 ml-5">{criterion.note}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {RATING_OPTIONS.map(option => (
                              <button
                                key={option.value}
                                onClick={() => setCurrentComparison({
                                  ...currentComparison,
                                  ratings: { ...currentComparison.ratings, [criterion.name]: option.value }
                                })}
                                className={`px-3 py-1 text-xs rounded ${
                                  currentComparison.ratings[criterion.name] === option.value
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addComparison}
              className="mt-6 w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Add Comparison
            </button>
          </div>
        )}

        {activeView === 'weights' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Configure Weights</h2>
            
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Category Weights</h3>
              {Object.keys(CATEGORIES).map(category => (
                <div key={category} className="flex items-center gap-3 mb-2">
                  <label className="flex-1">{category}</label>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.1"
                    value={categoryWeights[category]}
                    onChange={(e) => setCategoryWeights({ ...categoryWeights, [category]: parseFloat(e.target.value) })}
                    className="w-48"
                  />
                  <span className="w-12 text-right">{categoryWeights[category].toFixed(1)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {Object.entries(CATEGORIES).map(([category, criteria]) => (
                <div key={category} className="border-t pt-4">
                  <h3 className="font-semibold mb-3">{category}</h3>
                  {criteria.map(criterion => (
                    <div key={criterion.name} className="flex items-center gap-3 mb-2">
                      <label className="flex-1">{criterion.name}</label>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={criteriaWeights[criterion.name]}
                        onChange={(e) => setCriteriaWeights({ ...criteriaWeights, [criterion.name]: parseFloat(e.target.value) })}
                        className="w-48"
                      />
                      <span className="w-12 text-right">{criteriaWeights[criterion.name].toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'results' && (
          <div className="space-y-6">
            {comparisons.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No comparisons added yet. Go to "Add Comparisons" to start.
              </div>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMultiCompareView('individual')}
                      className={`px-4 py-2 rounded text-sm ${multiCompareView === 'individual' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Individual Comparisons
                    </button>
                    <button
                      onClick={() => setMultiCompareView('multi')}
                      className={`px-4 py-2 rounded text-sm ${multiCompareView === 'multi' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Multi-Competitor View
                    </button>
                    <button
                      onClick={() => setMultiCompareView('aggregate')}
                      className={`px-4 py-2 rounded text-sm ${multiCompareView === 'aggregate' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Aggregate Performance
                    </button>
                  </div>
                </div>

                {multiCompareView === 'aggregate' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Aggregate Performance</h2>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-3">By School</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={getAggregateBySchool()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="school" />
                            <YAxis domain={[-2, 2]} />
                            <Tooltip />
                            <Bar dataKey="avgScore" fill="#3b82f6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div>
                        <h3 className="font-medium mb-3">By Competitor Type</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={getAggregateByCompetitor()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="type" angle={-15} textAnchor="end" height={80} />
                            <YAxis domain={[-2, 2]} />
                            <Tooltip />
                            <Bar dataKey="avgScore" fill="#10b981" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {multiCompareView === 'multi' && (
                  <>
                    {getMultiCourseComparison().length === 0 ? (
                      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                        No courses with multiple competitors yet. Add more comparisons for the same course to see multi-competitor view.
                      </div>
                    ) : (
                      getMultiCourseComparison().map(group => (
                        <div key={`${group.school}-${group.courseName}`} className="bg-white rounded-lg shadow p-6">
                          <h3 className="text-xl font-semibold mb-4">
                            {group.school}: {group.courseName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Compared against {group.competitors.length} competitors
                          </p>

                          <div className="space-y-4 mb-6">
                            {Object.entries(CATEGORIES).map(([category, criteria]) => (
                              <div key={category} className="border rounded p-4">
                                <h4 className="font-medium mb-3">{category}</h4>
                                {group.competitors.map((comp, idx) => {
                                  const avgRating = criteria.reduce((sum, criterion) => sum + comp.ratings[criterion.name], 0) / criteria.length;
                                  const yourScore = 50 + (avgRating * 12.5);
                                  const competitorScore = 50 - (avgRating * 12.5);
                                  const weightedScore = calculateWeightedScore(comp);
                                  
                                  return (
                                    <div key={comp.id} className="mb-3 last:mb-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-gray-700 w-32 truncate">
                                          vs {comp.competitorName}
                                        </span>
                                        <div className="flex-1 relative h-6 bg-gray-100 rounded overflow-hidden">
                                          <div 
                                            className="absolute left-0 top-0 h-full transition-all"
                                            style={{ 
                                              width: `${yourScore}%`,
                                              backgroundColor: `hsl(${200 + idx * 40}, 70%, 50%)`
                                            }}
                                          />
                                          <div 
                                            className="absolute right-0 top-0 h-full transition-all"
                                            style={{ 
                                              width: `${competitorScore}%`,
                                              backgroundColor: `hsl(${0 + idx * 30}, 60%, 60%)`
                                            }}
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-0.5 h-full bg-gray-400" />
                                          </div>
                                          <div className="absolute inset-0 flex items-center justify-between px-2">
                                            <span className="text-xs font-semibold text-white drop-shadow">
                                              {yourScore > 55 ? avgRating.toFixed(1) : ''}
                                            </span>
                                            <span className="text-xs font-semibold text-white drop-shadow">
                                              {competitorScore > 55 ? (-avgRating).toFixed(1) : ''}
                                            </span>
                                          </div>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${weightedScore > 0.5 ? 'bg-green-100 text-green-700' : weightedScore < -0.5 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                          {weightedScore.toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>

                          <div className="pt-4 border-t">
                            <h4 className="font-medium mb-3">Overall Performance</h4>
                            <div className="space-y-2">
                              {group.competitors
                                .sort((a, b) => calculateWeightedScore(b) - calculateWeightedScore(a))
                                .map(comp => {
                                  const weightedScore = calculateWeightedScore(comp);
                                  return (
                                    <div key={comp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                      <div>
                                        <span className="font-medium text-sm">vs {comp.competitorName}</span>
                                        <span className="text-xs text-gray-500 ml-2">({comp.competitorType})</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold">
                                          {weightedScore.toFixed(2)}
                                        </span>
                                        <span className={`text-xs px-3 py-1 rounded font-medium ${weightedScore > 0.5 ? 'bg-green-100 text-green-700' : weightedScore < -0.5 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                          {weightedScore > 0.5 ? 'Leading' : weightedScore < -0.5 ? 'Behind' : 'Competitive'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {multiCompareView === 'individual' && comparisons.map(comparison => {
                  const weightedScore = calculateWeightedScore(comparison);
                  return (
                    <div key={comparison.id} className="bg-white rounded-lg shadow p-6">
                      <div className="mb-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              {comparison.school}: {comparison.courseName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              vs {comparison.competitorName}: {comparison.competitorCourseName}
                            </p>
                            <p className="text-xs text-gray-500">{comparison.competitorType}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">Alignment:</span>
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                                {getAlignmentLabel(comparison.alignment)}
                              </span>
                            </div>
                            <p className="text-sm font-medium mt-1">
                              Weighted Score: {weightedScore.toFixed(2)}
                            </p>
                            <div className="mt-2">
                              {getVerdictBadge(weightedScore)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setExpandedComparisons(prev => ({ ...prev, [comparison.id]: !prev[comparison.id] }))}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 whitespace-nowrap"
                            >
                              {expandedComparisons[comparison.id] ? 'Hide Details' : 'Show Details'}
                            </button>
                            <button
                              onClick={() => deleteComparison(comparison.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="font-medium mb-3 text-center">Category Comparison</h4>
                        <div className="space-y-3">
                          {Object.entries(CATEGORIES).map(([category, criteria]) => {
                            const avgRating = criteria.reduce((sum, criterion) => sum + comparison.ratings[criterion.name], 0) / criteria.length;
                            const yourScore = 50 + (avgRating * 12.5);
                            const competitorScore = 50 - (avgRating * 12.5);
                            
                            return (
                              <div key={category} className="border rounded p-3">
                                <div className="text-sm font-medium mb-2">{category}</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs w-20 text-right text-gray-600">Your course</span>
                                  <div className="flex-1 relative h-8 bg-gray-100 rounded overflow-hidden">
                                    <div 
                                      className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
                                      style={{ width: `${yourScore}%` }}
                                    />
                                    <div 
                                      className="absolute right-0 top-0 h-full bg-red-400 transition-all"
                                      style={{ width: `${competitorScore}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-0.5 h-full bg-gray-400" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-between px-2">
                                      <span className="text-xs font-semibold text-white drop-shadow">
                                        {yourScore > 55 ? avgRating.toFixed(1) : ''}
                                      </span>
                                      <span className="text-xs font-semibold text-white drop-shadow">
                                        {competitorScore > 55 ? (-avgRating).toFixed(1) : ''}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-xs w-24 text-gray-600">Competitor</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2 text-center">Radar View</h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={getRadarData(comparison)}>
                              <PolarGrid />
                              <PolarAngleAxis dataKey="category" style={{ fontSize: '11px' }} />
                              <PolarRadiusAxis domain={[0, 4]} />
                              <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2 text-center">Rating Summary</h4>
                          <div className="text-xs space-y-1 max-h-72 overflow-y-auto">
                            {Object.entries(CATEGORIES).map(([category, criteria]) => (
                              <div key={category}>
                                <div className="font-semibold text-gray-700 mt-2">{category}</div>
                                {criteria.map(criterion => {
                                  const rating = comparison.ratings[criterion.name];
                                  const ratingLabel = RATING_OPTIONS.find(o => o.value === rating)?.label;
                                  return (
                                    <div key={criterion.name} className="flex justify-between pl-2">
                                      <span>{criterion.name}</span>
                                      <span className={`font-medium ${rating > 0 ? 'text-green-600' : rating < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                        {ratingLabel}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {expandedComparisons[comparison.id] && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-3">Evaluation Guide</h4>
                          <div className="space-y-4">
                            {Object.entries(CATEGORIES).map(([category, criteria]) => (
                              <div key={category}>
                                <h5 className="font-medium text-sm text-blue-700 mb-2">{category}</h5>
                                <div className="space-y-2">
                                  {criteria.map(criterion => {
                                    const rating = comparison.ratings[criterion.name];
                                    const ratingLabel = RATING_OPTIONS.find(o => o.value === rating)?.label;
                                    return (
                                      <div key={criterion.name} className="bg-gray-50 p-3 rounded">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="font-medium text-sm">{criterion.name}</span>
                                          <span className={`text-xs px-2 py-0.5 rounded ${rating > 0 ? 'bg-green-100 text-green-700' : rating < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>
                                            {ratingLabel}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-600">{criterion.note}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
